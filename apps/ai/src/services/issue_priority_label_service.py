# apps/ai/src/services/issue_priority_label_service.py

from typing import Dict, Any
from models.issue_priority_issue.model import IssuePriorityIssueModel
from models.common.logger import get_logger

logger = get_logger(__name__)

class IssuePriorityLabelService:
    """이슈 우선순위 라벨링 서비스 (순수 비즈니스 로직)"""
    
    def __init__(self):
        """모델 초기화"""
        self.model = IssuePriorityIssueModel()

    def predict(self, subject: str, body: str = "") -> Dict[str, Any]:
        """
        모델에게 분석 요청 (순수 비즈니스 로직)
        
        Args:
            subject: 이슈 제목
            body: 이슈 본문
        
        Returns:
            {"priority": "HIGH"|"MEDIUM"|"LOW"} 형태의 딕셔너리
        """
        return self.model.predict(title=subject, body=body)
    
    def analyze_issue(self, title: str, body: str = "") -> str:
        """
        이슈를 분석하여 우선순위를 반환합니다.
        텍스트 유효성 검증 포함.
        
        Args:
            title: 이슈 제목
            body: 이슈 본문
        
        Returns:
            우선순위 ("HIGH", "MEDIUM", "LOW")
        """
        from models.common.text_utils import validate_issue_text
        
        # 텍스트 유효성 검증
        is_valid, error_msg = validate_issue_text(title, body)
        if not is_valid:
            logger.warning(f"⚠️ 의미없는 텍스트 감지: {error_msg}")
            return "LOW"
        
        # 모델 예측
        prediction = self.predict(title, body)
        return prediction["priority"]
