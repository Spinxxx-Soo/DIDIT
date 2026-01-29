# services/issue_priority_service.py
from typing import List, Dict, Optional, Any
from collections import defaultdict

from common.settings import MODEL_REGISTRY
from models.issue_priority_commit import (
    IssuePriorityModel,
    PriorityProcessor,
    PriorityLevel,
    PRIORITY_LABEL_MAP,
    PRIORITY_ORDER
)
from models.common.logger import get_logger

logger = get_logger(__name__)

"""
    해당 폴더에서 단일 이슈 & 목록 이슈 서비스를 정의 합니다.
    현재 목록 이슈 서비스만 정의하고 있습니다..
"""

class IssuePriorityService:
    """이슈 우선순위 재정렬 서비스 클래스
    
    이미 우선순위 라벨("상", "중", "하")이 붙어있는 이슈 목록을 받아,
    각 우선순위별로 그룹화한 후 점수 기반으로 재정렬합니다.
    """
    
    def __init__(self, use_rules: bool = True):
        """
        Args:
            use_rules: 후처리 규칙 사용 여부
        """
        self.model_name = MODEL_REGISTRY["issue_priority_commit"]
        self.use_rules = use_rules
        
        # 모델 및 프로세서 초기화
        logger.info("이슈 우선순위 서비스 초기화 중...")
        self.model = IssuePriorityModel()
        self.processor = PriorityProcessor(
            model_name=self.model_name,
            use_rules=use_rules
        )
        self.thresholds = self.model.get_thresholds()
        logger.info("이슈 우선순위 서비스 초기화 완료")
    
    @staticmethod
    def _build_text(subject: str, body: str = "") -> str:
        """이슈 제목과 본문을 결합하여 텍스트를 생성합니다.
        
        Args:
            subject: 이슈 제목
            body: 이슈 본문
        
        Returns:
            결합된 텍스트
        """
        if body:
            return f"{subject}\n{body}"
        return subject
    
    def _normalize_priority_label(self, priority: str) -> Optional[str]:
        """우선순위 라벨을 정규화합니다.
        Args:
            priority: 우선순위 라벨
        
        Returns:
            정규화된 우선순위 또는 None (알 수 없는 라벨)
        """
        normalized = PRIORITY_LABEL_MAP.get(priority)
        if normalized is None:
            logger.warning("알 수 없는 우선순위 라벨: %s", priority)
        return normalized
    
    def _calculate_score(self, subject: str, body: str = "") -> float:
        """이슈 텍스트에서 우선순위 점수를 계산합니다.
        
        Args:
            subject: 이슈 제목
            body: 이슈 본문
        
        Returns:
            return score: 우선순위 점수
        """
        text = self._build_text(subject, body)
        return self.model.predict_score(text)
    
    def _group_issues_by_priority(
        self, 
        issues: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """이슈 목록을 우선순위별로 그룹화합니다.
        
        Args:
            issues: 이슈 목록 [{"id": ..., "subject": str, "body": str, "priority": str}, ...]
        
        Returns:
            우선순위별로 그룹화된 딕셔너리 {priority: [issue, ...]}
        """
        grouped = defaultdict(list)
        
        for issue in issues:
            priority_label = issue.get("priority")
            if not priority_label:
                logger.warning(
                    "우선순위 라벨이 없는 이슈 발견 (id=%s), 건너뜁니다",
                    issue.get("id")
                )
                continue
            
            normalized_priority = self._normalize_priority_label(priority_label)
            if normalized_priority:
                grouped[normalized_priority].append(issue)
        
        return dict(grouped)
    
    def _sort_issues_by_score(
        self, 
        issues: List[Dict[str, Any]], 
        return_scores: bool = False
    ) -> List[Dict[str, Any]]:
        """이슈 목록을 점수 기준으로 내림차순 정렬합니다.
        
        Args:
            issues: 이슈 목록
            return_scores: 점수를 결과에 포함할지 여부
        
        Returns:
            점수 기준으로 정렬된 이슈 목록
        """
        scored_issues = []
        
        for issue in issues:
            subject = issue.get("subject", "")
            body = issue.get("body", "")
            score = self._calculate_score(subject, body)
            
            result_issue = {**issue}
            
            if return_scores:
                result_issue["score"] = score
            
            scored_issues.append((score, result_issue))
        
        # 점수 기준 내림차순 정렬
        scored_issues.sort(key=lambda x: x[0], reverse=True)
        
        return [issue for _, issue in scored_issues]
    
    def _merge_priority_groups(
        self, 
        grouped_issues: Dict[str, List[Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        """우선순위별로 정렬된 그룹을 우선순위 순서대로 병합합니다.
        
        Args:
            grouped_issues: 우선순위별로 그룹화된 이슈 딕셔너리
        
        Returns:
            우선순위 순서대로 병합된 이슈 목록 (상 -> 중 -> 하)
        """
        merged = []
        
        # 우선순위 순서대로 병합 (HIGH -> MED -> LOW)
        for priority in [PriorityLevel.HIGH, PriorityLevel.MED, PriorityLevel.LOW]:
            if priority in grouped_issues:
                merged.extend(grouped_issues[priority])
        
        return merged
    
    def reorder_by_priority(
        self, 
        issues: List[Dict[str, Any]], 
        return_scores: bool = False
    ) -> List[Dict[str, Any]]:
        """이슈 목록을 우선순위별로 재정렬합니다.
        
        이미 우선순위 라벨("상", "중", "하")이 붙어있는 이슈 목록을 받아,
        각 우선순위별로 그룹화한 후 점수 기준으로 재정렬합니다.
        
        Args:
            issues: 이슈 목록 [{"id": ..., "subject": str, "body": str, "priority": str}, ...]
            return_scores: 점수를 결과에 포함할지 여부
        
        Returns:
            재정렬된 이슈 목록 (우선순위별 그룹 내에서 점수 높은 순)
        """
        if not issues:
            logger.warning("빈 이슈 목록이 전달되었습니다")
            return []
        
        logger.info("이슈 재정렬 시작 (총 %d개)", len(issues))
        
        # 1. 우선순위별로 그룹화
        grouped_issues = self._group_issues_by_priority(issues)
        
        if not grouped_issues:
            logger.warning("유효한 우선순위 라벨이 있는 이슈가 없습니다")
            return []
        
        # 2. 각 그룹 내에서 점수 기준으로 정렬
        sorted_groups = {}
        for priority, priority_issues in grouped_issues.items():
            logger.debug(
                "우선순위 '%s' 그룹 정렬 중 (%d개)",
                priority,
                len(priority_issues)
            )
            sorted_groups[priority] = self._sort_issues_by_score(
                priority_issues,
                return_scores
            )
        
        # 3. 우선순위 순서대로 병합
        reordered_issues = self._merge_priority_groups(sorted_groups)
        
        logger.info("이슈 재정렬 완료 (총 %d개)", len(reordered_issues))
        
        return reordered_issues
