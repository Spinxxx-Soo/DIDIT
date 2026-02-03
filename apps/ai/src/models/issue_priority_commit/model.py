# models/issue_priority_commit/model.py
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from models.common.hf_io import try_download_from_hf, try_load_json
from models.common.logger import get_logger
from models.issue_priority_commit.config import (
    MODEL_ID,
    MODEL_THRESHOLDS,
    MODEL_MAX_LENGTH,
    REQUIRED_THRESHOLD_KEYS
)
import torch
from typing import Dict

logger = get_logger(__name__)


class IssuePriorityModel:
    """이슈 우선순위 예측 모델 클래스 (싱글톤 패턴)"""
    
    # 클래스 변수: 싱글톤 인스턴스 공유
    _tokenizer = None
    _model = None
    _device = None
    _thresholds = None
    _model_name = None
    _max_length = None

    def __init__(self):
        """인스턴스 초기화 (싱글톤 패턴)"""
        if self.__class__._model is None:
            self.__class__._load_once()
        
        # 클래스 변수를 인스턴스 변수로 참조
        self.tokenizer = self.__class__._tokenizer
        self.model = self.__class__._model
        self.device = self.__class__._device
        self.thresholds = self.__class__._thresholds
        self.model_name = self.__class__._model_name
        self.max_length = self.__class__._max_length
    
    @classmethod
    def _load_once(cls) -> None:
        """모델과 관련 리소스를 한 번만 로드합니다 (클래스 메서드)"""
        logger.info("이슈 우선순위 모델 초기 로드 시작")
        
        cls._model_name = MODEL_ID
        cls._max_length = MODEL_MAX_LENGTH
        
        # 디바이스 결정
        cls._device = cls._get_device()
        
        # 모델 및 토크나이저 로드
        cls._load_model()
        
        # Threshold 로드
        cls._thresholds = cls._load_thresholds()
        
        logger.info("이슈 우선순위 모델 초기 로드 완료")
    
    @classmethod
    def _get_device(cls) -> torch.device:
        """사용 가능한 디바이스를 결정합니다.
        
        Returns:
            torch.device: 사용할 디바이스 (cuda 또는 cpu)
        """
        if torch.cuda.is_available():
            device = torch.device("cuda")
            logger.info("GPU 사용: %s", device)
        else:
            device = torch.device("cpu")
            logger.info("CPU 사용")
        return device
    
    @classmethod
    def _load_model(cls) -> None:
        """모델과 토크나이저를 로드합니다."""
        logger.info("모델 로드 중: %s", cls._model_name)
        
        cls._tokenizer = AutoTokenizer.from_pretrained(cls._model_name)
        cls._model = AutoModelForSequenceClassification.from_pretrained(cls._model_name)
        cls._model.eval()
        
        # 모델을 디바이스로 이동
        cls._model = cls._model.to(cls._device)
        logger.info("모델 로드 완료")
    
    @classmethod
    def _load_thresholds(cls) -> Dict:
        """score_thresholds.json 로드. 실패 시 기본값 사용.
        
        Returns:
            Dict: threshold 딕셔너리
        """
        filename = "score_thresholds.json"
        path = try_download_from_hf(cls._model_name, filename)

        if path is None:
            logger.warning("huggingface threshold 파일 다운로드 실패, 기본값 사용")
            return MODEL_THRESHOLDS.copy()
        
        data = try_load_json(path)
        if data is None:
            logger.warning("threshold JSON 로드 실패 (path=%s), 기본값 사용", path)
            return MODEL_THRESHOLDS.copy()

        missing_required = REQUIRED_THRESHOLD_KEYS - set(data.keys())
        
        # 유효성 체크 (키가 없으면 fallback)
        if missing_required:
            logger.warning(
                "threshold 키 누락 %s (path=%s), 기본값 사용",
                missing_required,
                path
            )
            return MODEL_THRESHOLDS.copy()
        
        return data
    
    def _move_inputs_to_device(self, inputs: Dict[str, torch.Tensor]) -> Dict[str, torch.Tensor]:
        """입력을 모델과 같은 디바이스로 이동합니다.
        
        Args:
            inputs: 토크나이저 입력 딕셔너리
        
        Returns:
            디바이스로 이동된 입력 딕셔너리
        """
        return {k: v.to(self.device) for k, v in inputs.items()}
    
    def _scale_score(self, score_raw: float) -> float:
        """원시 점수를 원래 스케일로 복원합니다.
        
        Args:
            score_raw: 0~1 범위의 원시 점수
        
        Returns:
            원래 스케일의 점수
        """
        train_min = self.thresholds["train_min"]
        train_max = self.thresholds["train_max"]
        return score_raw * (train_max - train_min) + train_min

    def predict_score(self, text: str) -> float:
        """텍스트에서 우선순위 점수 예측
        
        Args:
            text: 이슈 텍스트 (제목 + 본문)
        
        Returns:
            우선순위 점수 (원래 스케일)
        """
        # 토크나이징
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
<<<<<<< HEAD
            max_length=256
        )
        
        # GPU 사용 시 입력도 GPU로 이동
        if torch.cuda.is_available():
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
=======
            max_length=self.max_length
        )
        
        # 입력을 모델과 같은 디바이스로 이동
        inputs = self._move_inputs_to_device(inputs)
>>>>>>> 691993c3e9e07de840a473c2b7432f71e361dd4e
        
        # 예측
        with torch.no_grad():
            outputs = self.model(**inputs)
            score_raw = outputs.logits.item()  # 0~1 범위
        
        # 원래 스케일로 복원
<<<<<<< HEAD
        train_min = self.thresholds["train_min"]
        train_max = self.thresholds["train_max"]
        score = score_raw * (train_max - train_min) + train_min
        
        return score
    
    def get_thresholds(self) -> dict:
=======
        return self._scale_score(score_raw)
    
    def get_thresholds(self) -> Dict:
>>>>>>> 691993c3e9e07de840a473c2b7432f71e361dd4e
        """Threshold 값 반환"""
        return self.thresholds
