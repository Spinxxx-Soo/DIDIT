# models/issue_priority_commit/model.py
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from hf_hub_download import huggingface_hub
from common.settings import MODEL_REGISTRY
from models.common.hf_io import try_download_from_hf, try_load_json
from models.common.logger import get_logger
from models.issue_priority_commit.constants import (
    MODEL_THRESHOLDS,
    REQUIRED_THRESHOLD_KEYS
)
import torch
import json
from typing import Dict

logger = get_logger(__name__)

class IssuePriorityModel:
    """이슈 우선순위 예측 모델 클래스"""

    def __init__(self):
        self.model_name = MODEL_REGISTRY["issue_priority_commit"]
        
        # 모델 로드 (허깅페이스에서 자동 다운로드)
        logger.info("모델 로드 중: %s", self.model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
        self.model.eval()
        
        # GPU 사용 가능 시 자동 이동
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        if torch.cuda.is_available():
            self.model = self.model.to(self.device)
            logger.info("GPU 사용: %s", self.device)
        
        # Threshold 로드
        self.thresholds = self._load_thresholds()

    
    
    def _load_thresholds(self) -> Dict:
        """score_thresholds.json 로드. 실패 시 기본값 사용."""
        filename = "score_thresholds.json"

        path = try_download_from_hf(self.model_name, filename)

        if path is None:
            logger.warning("huggingface threshold 파일 다운로드 실패, 기본값 사용")
            return MODEL_THRESHOLDS.copy()
        
        data = try_load_json(path)
        if data is None:
            logger.warning("threshold JSON 로드 실패 (path=%s), 기본값 사용)", path)
            return MODEL_THRESHOLDS.copy()

        missing_required = REQUIRED_THRESHOLD_KEYS - set(data.keys())
                
        #유효성 체크 (키가 없으면 fallback)
        if missing_required:
            logger.warning("threshold 키 누락 %s(path=%s) , 기본값 사용)", missing_required, path)
            return MODEL_THRESHOLDS.copy()
        
        return data
        

    def predict_score(self, text: str) -> float:
        """
        텍스트에서 우선순위 점수 예측
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
            max_length=256
        )
        
        # GPU 사용 시 입력도 GPU로 이동
        if torch.cuda.is_available():
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # 예측
        with torch.no_grad():
            outputs = self.model(**inputs)
            score_raw = outputs.logits.item()  # 0~1 범위
        
        # 원래 스케일로 복원
        train_min = self.thresholds["train_min"]
        train_max = self.thresholds["train_max"]
        score = score_raw * (train_max - train_min) + train_min
        
        return score
    
    def get_thresholds(self) -> Dict:
        """Threshold 값 반환"""
        return self.thresholds
