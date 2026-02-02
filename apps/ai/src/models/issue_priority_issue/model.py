# models/issue_priority_issue/model.py
"""이슈 단일 우선순위 라벨링 모델 클래스"""
import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import re
from typing import Optional, Dict
from models.common.logger import get_logger

logger = get_logger(__name__)


class IssuePriorityIssueModel:
    """이슈 단일 우선순위 라벨링 모델 클래스"""
    
    def __init__(self, base_model_id: str = "unsloth/llama-3-8b-bnb-4bit", 
                 adapter_path: str = "./final_lora_weights"):
        """모델 초기화
        
        Args:
            base_model_id: 기본 모델 ID
            adapter_path: LoRA 어댑터 경로
        """
        logger.info("이슈 단일 우선순위 모델 로드 중...")
        
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(base_model_id)
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.float16,
            )
            
            self.base_model = AutoModelForCausalLM.from_pretrained(
                base_model_id,
                quantization_config=bnb_config,
                device_map="auto",
                trust_remote_code=True
            )
            
            self.model = PeftModel.from_pretrained(self.base_model, adapter_path)
            self.model.eval()
            
            logger.info("이슈 단일 우선순위 모델 로드 완료")
        except Exception as e:
            logger.error("모델 로드 실패: %s", str(e))
            raise
    
    def predict(self, title: str, body: str = "") -> Dict[str, str]:
        """이슈의 우선순위를 예측합니다.
        
        Args:
            title: 이슈 제목
            body: 이슈 본문
        
        Returns:
            {"priority": "high|medium|low"} 형태의 딕셔너리
        """
        try:
            # 본문 예외 처리
            safe_body = body.strip() if body and body.strip() else "(본문 내용 없음)"
            input_text = f"제목: {title}\n본문: {safe_body}"
            
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
            inputs = self.tokenizer(prompt, return_tensors="pt").to("cuda")
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=10,
                    temperature=0.01,
                    do_sample=False,
                    eos_token_id=self.tokenizer.eos_token_id
                )
            
            decoded_output = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            score_match = re.findall(r"\d+\.\d+|\d+", decoded_output.split("중요도 점수:")[-1])
            
            if not score_match:
                logger.warning("점수 추출 실패, 기본값(medium) 사용")
                return {"priority": "medium"}
            
            score_val = float(score_match[0])
            
            # 등급 판별
            if score_val >= 7.0:
                priority = "high"
            elif score_val >= 3.0:
                priority = "medium"
            else:
                priority = "low"
            
            logger.debug("이슈 우선순위 예측 완료: %s (점수: %.2f)", priority, score_val)
            return {"priority": priority}
            
        except Exception as e:
            logger.error("이슈 우선순위 예측 중 오류 발생: %s", str(e))
            # 오류 발생 시 기본값 반환
            return {"priority": "medium"}
