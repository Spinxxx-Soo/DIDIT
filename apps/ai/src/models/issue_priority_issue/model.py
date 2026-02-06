# apps/ai/src/models/issue_priority_issue/model.py
"""이슈 단일 우선순위 라벨링 모델 클래스"""

import torch
import re
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from typing import Dict
from models.issue_priority_issue.config import MODEL_ID, ADAPTER_PATH, BNB_CONFIG, MAX_MEMORY, USE_LORA
from models.common.logger import get_logger

logger = get_logger(__name__)

class IssuePriorityIssueModel:
    def __init__(self):
        logger.info("⏳ [VRAM 6GB 최적화] 모델 로딩 시작...")
        try:
            # CUDA 사용 가능 여부 확인
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"사용할 디바이스: {self.device}")
            
            self.tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
            
            # CUDA가 있을 때만 quantization 사용
            if self.device == "cuda":
                logger.info("CUDA 사용 가능 - GPU 모드로 로드")
                try:
                    # device_map 없이 로드 후 수동으로 이동 (더 안전함)
                    self.base_model = AutoModelForCausalLM.from_pretrained(
                        MODEL_ID,
                        quantization_config=BNB_CONFIG,
                        trust_remote_code=True,
                        torch_dtype=torch.float16
                    )
                    # 수동으로 GPU로 이동
                    self.base_model = self.base_model.to(self.device)
                    logger.info(f"모델을 {self.device}로 이동 완료")
                except Exception as e:
                    logger.warning(f"Quantization 로드 실패, quantization 없이 재시도: {e}")
                    # quantization 없이 로드
                    self.base_model = AutoModelForCausalLM.from_pretrained(
                        MODEL_ID,
                        trust_remote_code=True,
                        torch_dtype=torch.float16
                    )
                    self.base_model = self.base_model.to(self.device)
                    logger.info(f"모델을 {self.device}로 이동 완료 (quantization 없음)")
            else:
                # CPU 환경에서는 quantization 없이 로드
                logger.warning("CUDA를 사용할 수 없어 CPU 모드로 로드합니다. 성능이 저하될 수 있습니다.")
                self.base_model = AutoModelForCausalLM.from_pretrained(
                    MODEL_ID,
                    trust_remote_code=True,
                    torch_dtype=torch.float32  # CPU는 float32 사용
                )
                self.base_model = self.base_model.to(self.device)
            
            if USE_LORA:
                # 가중치 경로 확인
                from pathlib import Path
                adapter_path = Path(ADAPTER_PATH)
                adapter_config = adapter_path / "adapter_config.json"
                
                if not adapter_path.exists():
                    logger.warning(f"⚠️ 가중치 경로가 존재하지 않습니다: {ADAPTER_PATH}")
                    logger.warning("기본 모델을 사용합니다.")
                    self.model = self.base_model
                elif not adapter_config.exists():
                    logger.warning(f"⚠️ adapter_config.json 파일이 없습니다: {adapter_config}")
                    logger.warning("기본 모델을 사용합니다.")
                    self.model = self.base_model
                else:
                    try:
                        # adapter_config.json 파일이 유효한지 확인
                        import json
                        with open(adapter_config, 'r', encoding='utf-8') as f:
                            config_content = f.read().strip()
                            if not config_content or config_content.startswith('<!DOCTYPE'):
                                logger.error(f"❌ adapter_config.json이 유효하지 않습니다 (HTML 파일로 다운로드됨)")
                                logger.warning("기본 모델을 사용합니다.")
                                self.model = self.base_model
                            else:
                                json.loads(config_content)  # JSON 유효성 검사
                                logger.info(f"가중치 로드 시도: {ADAPTER_PATH}")
                                self.model = PeftModel.from_pretrained(self.base_model, ADAPTER_PATH)
                                logger.info("✅ LoRA 가중치 로드 성공")
                    except json.JSONDecodeError as e:
                        logger.error(f"❌ adapter_config.json 파싱 오류: {e}")
                        logger.warning("기본 모델을 사용합니다.")
                        self.model = self.base_model
                    except Exception as e:
                        logger.error(f"❌ LoRA 가중치 로드 실패: {e}")
                        logger.warning("기본 모델을 사용합니다.")
                        self.model = self.base_model
            else:
                self.model = self.base_model
                
            self.model.eval()
            logger.info("✅ 모델 로드 성공")
        except Exception as e:
            logger.error(f"모델 로드 실패: {e}")
            raise

    def predict(self, title: str, body: str = "") -> Dict:
        # 15개 고도화 Few-shot 프롬프트
        prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
            당신은 IT 서비스 장애 판단 전문가입니다. 아래 예시를 참고하여 이슈의 심각도를 0.0~10.0 사이로 평가하세요. 오직 숫자만 대답하세요.

            [평가 예시]
            1. 제목: 결제 오류 / 본문: 카드 결제가 안 됨 -> 점수: 9.5
            2. 제목: 호출 시 처리 오류 / 본문: api 호출 시 오류 -> 점수: 9.5
            3. 제목: 로그인 오류 / 본문: 로그인 버튼 눌러도 반응 없음 -> 점수: 9.0
            4. 제목: 프로젝트 생성 오류 / 본문: 생성 버튼 클릭 시 오류-> 점수: 8.5
            5. 제목: 쿠폰 적용 안 됨 / 본문: 고객 결제 시 쿠폰적용이 되지 않음 -> 점수: 8.0
            6. 제목: 백엔드, 프론트엔드 연결 / 본문: 백엔드, 프론트엔드 연결 -> 점수: 7.5
            7. 제목: CRUD 구현 / 본문: 댓글 CRUD 구현 -> 점수: 6.0
            8. 제목: 검색 결과 이상 / 본문: 검색어와 상관없는 결과가 나옴 -> 점수: 5.5
            9. 제목: 기본 페이지 제작 / 본문: 마이 페이지 제작 구현 -> 점수: 5.0
            10. 제목: 기사 조회 구현 / 본문: 최근 기사 5개 조회 구현 -> 점수: 4.0
            11. 제목: 이미지 로딩 느림 / 본문: 메인 배너가 5초 늦게 뜸 -> 점수: 3.5
            12. 제목: 네비게이션 바 수정 / 본문: 네비게이션 바에 마이페이지 추가 구현 -> 점수: 3.0
            13. 제목: 디자인 수정 / 본문: 메인 배너 사진 수정 -> 점수: 2.0
            14. 제목: 폰트 수정 / 본문: 전반적인 폰트 수정 -> 점수: 1.5
            15. 제목: 오타 수정 / 본문: 공지사항에 '안녕헤세요' 오타 있음 -> 점수: 1.0

            ### 분석할 이슈:
            제목: {title}
            본문: {body}

            ### 중요도 점수:<|eot_id|><|start_header_id|>assistant<|end_header_id|>
            심각도 점수:"""

        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
        input_length = inputs.input_ids.shape[1]

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=2,
                use_cache=True,
                temperature=0.01,
                do_sample=False,
                repetition_penalty=1.2,
                eos_token_id=self.tokenizer.eos_token_id
            )
        
        answer = self.tokenizer.decode(outputs[0][input_length:], skip_special_tokens=True).strip()
        score_match = re.findall(r"(\d{1,2}\.\d|\d{1,2})", answer)
        
        score_val = float(score_match[0]) if score_match else 5.0
        priority = "high" if score_val >= 7.0 else "medium" if score_val >= 3.0 else "low"
            
        return {"priority": priority, "score": score_val}
