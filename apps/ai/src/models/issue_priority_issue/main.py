# apps/ai/src/models/issue_priority_issue/main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import re
from typing import Optional

app = FastAPI()

# 1. 모델 및 토크나이저 로드
base_model_id = "unsloth/llama-3-8b-bnb-4bit"
adapter_path = "./final_lora_weights" # GPU 서버 내 이 파일과 같은 위치에 폴더가 있어야 함

tokenizer = AutoTokenizer.from_pretrained(base_model_id)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
)

base_model = AutoModelForCausalLM.from_pretrained(
    base_model_id,
    quantization_config=bnb_config,
    device_map="auto", 
    trust_remote_code=True
)

model = PeftModel.from_pretrained(base_model, adapter_path)
model.eval()

# 2. 입력 데이터 규격 정의 (issue_id 추가)
class IssueRequest(BaseModel):
    issue_id: int            # 백엔드 식별을 위한 ID
    title: str
    body: Optional[str] = ""

@app.post("/predict")
async def predict(request: IssueRequest):
    try:
        # 본문 예외 처리
        safe_body = request.body.strip() if request.body and request.body.strip() else "(본문 내용 없음)"
        input_text = f"제목: {request.title}\n본문: {safe_body}"
        
        # 프롬프트 구성
        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

당신은 IT 서비스 장애 판단 전문가입니다. 이슈의 심각도를 0.0에서 10.0 사이로 평가하세요. 오직 숫자만 대답하세요.

[중요도 가이드라인]
- 9.0 ~ 10.0: 전면 장애, 결제 불능, 데이터 유실, 개인정보 유출
- 7.0 ~ 8.5: 특정 기능 마비 (강제 종료, 무한 로딩), 금전적 손실 발생
- 4.0 ~ 6.0: 기능 오동작 (정렬 오류, 검색 결과 부정확)
- 1.0 ~ 3.0: 단순 UI/UX 문제 (오타, 이미지 어긋남)

### 분석할 이슈:
{input_text}

### 중요도 점수:<|eot_id|><|start_header_id|>assistant<|end_header_id|>"""

        # 추론 수행
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
        score_match = re.findall(r"\d+\.\d+|\d+", decoded_output.split("중요도 점수:")[-1])
        
        if not score_match:
            raise ValueError("점수 추출에 실패했습니다.")
            
        score_val = float(score_match[0])

        # 등급 판별 (medium 범위를 동료분 constants와 유사하게 4.0 정도로 조정했습니다)
        if score_val >= 7.0:
            priority = "high"
        elif score_val >= 3.0:
            priority = "medium"
        else:
            priority = "low"

        # 3. 결과 반환 (받았던 issue_id를 그대로 돌려줌)
        return {
            "issue_id": request.issue_id,
            "priority": priority
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "GPU Scoring API is running"}