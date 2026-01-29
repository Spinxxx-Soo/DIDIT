# models/issue_priority_commit/processor.py
from typing import Optional, Dict, Any, List
import yaml

from models.common.hf_io import try_download_from_hf
from models.common.logger import get_logger
from models.issue_priority_commit.constants import (
    PriorityLevel,
    PRIORITY_THRESHOLDS
)

logger = get_logger(__name__)


class PriorityProcessor:
    """우선순위 후처리 프로세서
    
    모델의 예측 점수를 HIGH/MED/LOW 우선순위로 변환하고,
    선택적으로 후처리 규칙을 적용합니다.
    """
    
    # 규칙 파일 경로
    RULES_FILENAME = "postprocess/priority_rules.yaml"
    
    def __init__(self, model_name: str, use_rules: bool = True):
        """
        Args:
            model_name: issue_priority_commit
            use_rules: 후처리 규칙 사용 여부
        """
        self.model_name = model_name
        self.use_rules = use_rules
        self.rules: Optional[Dict[str, Any]] = None
        
        if use_rules:
            self.rules = self._load_rules()
    
    def _load_rules(self) -> Optional[Dict[str, Any]]:
        """후처리 규칙을 HuggingFace에서 로드합니다.
        
        Returns:
            규칙 딕셔너리 또는 None (로드 실패 시)
        """
        try:
            rules_path = try_download_from_hf(
                repo_id=self.model_name,
                filename=self.RULES_FILENAME
            )
            
            if rules_path is None:
                logger.warning(
                    "후처리 규칙 파일 다운로드 실패 (repo_id=%s, filename=%s), ",
                    self.model_name,
                    self.RULES_FILENAME
                )
                return None
            
            with open(rules_path, "r", encoding="utf-8") as f:
                rules = yaml.safe_load(f)
                
            if not isinstance(rules, dict):
                logger.warning(
                    "후처리 규칙 파일 형식이 올바르지 않습니다 (path=%s), ",
                    rules_path
                )
                return None
                
            logger.info("후처리 규칙 로드 완료 (path=%s)", rules_path)
            return rules
            
        except Exception as e:
            logger.warning(
                "후처리 규칙 로드 중 오류 발생 (%s), 규칙 없이 사용합니다",
                str(e)
            )
            return None
    
    """
    여기서 부터는 삭제해야할 수도 있음. (목록 우선 순위를 산출하면 되는 거라)
    """           
    def _apply_rule_based_priority(
        self, 
        score: float, 
        text: str, 
        thresholds: Dict[str, float]
    ) -> Optional[str]:
        """후처리 규칙을 적용하여 우선순위를 결정합니다.
        
        Args:
            score: 우선순위 점수
            text: 이슈 텍스트
            thresholds: threshold 딕셔너리
        
        Returns:
            규칙에 의해 결정된 우선순위 또는 None (규칙 적용 안 됨)
        """
        if not self.rules or not text:
            return None
        
        text_lower = text.lower()
        
        # LOW 강제 키워드 체크
        low_keywords = self.rules.get("low_forced_keywords", [])
        if self._contains_any_keyword(text_lower, low_keywords):
            return PriorityLevel.LOW
        
        # HIGH 부스트 키워드 체크
        high_keywords = self.rules.get("high_boost_keywords", [])
        if self._contains_any_keyword(text_lower, high_keywords):
            return PriorityLevel.HIGH
        
        # 최소 MED 보장 키워드 체크
        min_med_keywords = self.rules.get("min_med_keywords", [])
        if self._contains_any_keyword(text_lower, min_med_keywords):
            if score <= thresholds["q_low"]:
                return PriorityLevel.MED
        
        return None
    
    @staticmethod
    def _contains_any_keyword(text: str, keywords: List[str]) -> bool:
        """텍스트에 키워드 목록 중 하나라도 포함되어 있는지 확인합니다.
        
        Args:
            text: 검색할 텍스트
            keywords: 키워드 목록
        
        Returns:
            키워드가 하나라도 포함되어 있으면 True
        """
        return any(keyword in text for keyword in keywords)
    
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
        
        후처리 규칙이 활성화되어 있고 텍스트가 제공된 경우,
        규칙을 먼저 적용하고, 규칙이 적용되지 않으면 threshold 기반 변환을 수행합니다.
        
        Args:
            score: 우선순위 점수
            text: 이슈 텍스트 (후처리 규칙 사용 시 필요)
            thresholds: threshold 딕셔너리 (None이면 기본값 사용)
        
        Returns:
            "HIGH", "MED", 또는 "LOW"
        """
        if thresholds is None:
            thresholds = PRIORITY_THRESHOLDS.copy()
        
        # 후처리 규칙 적용 시도
        if self.use_rules:
            rule_based_priority = self._apply_rule_based_priority(
                score, text, thresholds
            )
            if rule_based_priority is not None:
                return rule_based_priority
        
        # 기본 변환 (threshold 기반)
        return self._convert_score_to_priority(score, thresholds)
