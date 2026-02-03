# models/issue_priority_issue/model.py
"""이슈 단일 우선순위 라벨링 모델 클래스"""
import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import re
from typing import Optional, Dict
from models.issue_priority_issue.config import (
    MODEL_ID,
    ADAPTER_PATH,
    BNB_CONFIG,
    USE_LORA
)
from models.common.logger import get_logger
from models.common.text_utils import build_issue_text

logger = get_logger(__name__)

class IssuePriorityIssueModel:
    """이슈 단일 우선순위 라벨링 모델 클래스"""
    
    def __init__(self):

        logger.info("이슈 단일 우선순위 모델 로드 중...")
        
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
            self.base_model = AutoModelForCausalLM.from_pretrained(
                MODEL_ID,
                quantization_config=BNB_CONFIG,
                device_map="auto",
                trust_remote_code=True
            )
            
            # Test 용 로라 다운 - 추후 수정 필요 
            if USE_LORA:
                self.model = PeftModel.from_pretrained(self.base_model, ADAPTER_PATH)
            else:
                self.model = self.base_model
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
            # 제목과 본문 결합 (공통 유틸리티 사용)
            input_text = build_issue_text(title, body)
            
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

            # 추론 수행(gpu)
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
