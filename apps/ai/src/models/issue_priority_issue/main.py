import json
import redis
import torch
import re
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel

# --- [1. 설정 및 Redis 연결] ---
REDIS_HOST = '백엔드_레디스_IP'  # 담당자에게 받은 IP로 수정하세요!
REDIS_PORT = 6379
QUEUE_NAME = "issue_priority_queue"

r_queue = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
r_result = redis.StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=1, decode_responses=True)

# --- [2. 모델 및 토크나이저 로드 (기존 설정 그대로)] ---
base_model_id = "unsloth/llama-3-8b-bnb-4bit"
adapter_path = "./final_lora_weights"

tokenizer = AutoTokenizer.from_pretrained(base_model_id)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
)

print("⏳ 모델 로드 중...")
base_model = AutoModelForCausalLM.from_pretrained(
    base_model_id,
    quantization_config=bnb_config,
    device_map="auto", 
    trust_remote_code=True
)
model = PeftModel.from_pretrained(base_model, adapter_path)
model.eval()
print("✅ 준비 완료! Redis 큐를 감시합니다.")

# --- [3. 메인 루프] ---
while True:
    try:
        # 큐에서 작업 대기
        task = r_queue.blpop(QUEUE_NAME, timeout=0)
        
        if task:
            _, message = task
            data = json.loads(message)
            job_id = data.get('job_id')
            title = data.get('subject', '제목 없음') # 백엔드 필드명 'subject' 대응
            body = data.get('body', '')

            print(f"📩 [수신] Job ID: {job_id}")

            # 본문 방어 로직
            safe_body = body.strip() if body and body.strip() else "(본문 내용 없음)"
            input_text = f"제목: {title}\n본문: {safe_body}"

            # 기존 프롬프트 복구
            prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

당신은 IT 서비스 장애 판단 전문가입니다. 이슈의 심각도를 0.0에서 10.0 사이로 평가하세요. 오직 숫자만 대답하세요.

[중요도 가이드라인]
- 9.0 ~ 10.0: 전면 장애, 결제 불능, 데이터 유실, 개인정보 유출
- 7.0 ~ 8.5: 특정 기능 마비 (강제 종료, 무한 로딩), 금전적 손실 발생(결제 금액 오류)
- 4.0 ~ 6.0: 기능 오동작 (정렬 오류, 검색 결과 부정확, 우회 가능함)
- 1.0 ~ 3.0: 단순 UI/UX 문제 (오타, 상품 명칭 오류, 이미지 어긋남)

### 분석할 이슈:
{input_text}

### 중요도 점수:<|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

            # GPU 추론
            inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
            with torch.no_grad():
                outputs = model.generate(
                    **inputs, 
                    max_new_tokens=10, 
                    temperature=0.01, 
                    do_sample=False,
                    eos_token_id=tokenizer.eos_token_id
                )
            
            decoded_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # 기존 정규식 기반 점수 추출 로직 복구
            score_section = decoded_output.split("중요도 점수:")[-1]
            score_match = re.findall(r"\d+\.\d+|\d+", score_section)
            
            if score_match:
                score_val = float(score_match[0])
                # 점수에 따른 등급 판별
                if score_val >= 7.0:
                    priority = "high"
                elif score_val >= 3.0:
                    priority = "medium"
                else:
                    priority = "low"
            else:
                priority = "medium" # 실패 시 기본값

            # 결과 저장 (Redis DB 1번)
            result_key = f"issue_priority_result:{job_id}"
            r_result.set(result_key, priority, ex=3600)

            print(f"✅ [완료] {result_key} -> {priority} (Score: {score_val if score_match else 'N/A'})")

    except Exception as e:
        print(f"⚠️ 에러: {e}")