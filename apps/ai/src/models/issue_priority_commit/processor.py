# models/issue_priority_commit/processor.py
from typing import Optional, Dict

from models.common.logger import get_logger
from models.issue_priority_commit.config import (
    PriorityLevel,
    PRIORITY_THRESHOLDS
)

logger = get_logger(__name__)


class PriorityProcessor:
    """우선순위 후처리 프로세서
    
    모델의 예측 점수를 HIGH/MED/LOW 우선순위로 변환합니다.
    (현재 서비스에서는 사용 X)
    
    threshold 기반 변환만 수행합니다.
    """
    
    def __init__(self, model_name: str = "", use_rules: bool = False):
        """
        Args:
            model_name: 호환성을 위해 유지 (사용 안 함)
            use_rules: 호환성을 위해 유지 (사용 안 함)
        """
        pass
    
    def _convert_score_to_priority(
        self, 
        score: float, 
        thresholds: Dict[str, float]
    ) -> str:
        """점수를 threshold 기반으로 우선순위로 변환합니다.
        
        Args:
            score: 우선순위 점수
            thresholds: threshold 딕셔너리
        
        Returns:
            "HIGH", "MED", 또는 "LOW"
        """
        if score >= thresholds["q_high"]:
            return PriorityLevel.HIGH
        elif score <= thresholds["q_low"]:
            return PriorityLevel.LOW
        else:
            return PriorityLevel.MED
    
    def to_priority(
        self, 
        score: float, 
        text: str = "", 
        thresholds: Optional[Dict[str, float]] = None
    ) -> str:
        """점수를 HIGH/MED/LOW 우선순위로 변환합니다.
        
        threshold 기반 변환만 수행합니다.
        
        Args:
            score: 우선순위 점수
            text: 호환성을 위해 유지 (사용 안 함)
            thresholds: threshold 딕셔너리 (None이면 기본값 사용)
        
        Returns:
            "HIGH", "MED", 또는 "LOW"
        """
        if thresholds is None:
            thresholds = PRIORITY_THRESHOLDS.copy()
        
        # threshold 기반 변환
        return self._convert_score_to_priority(score, thresholds)
