# services/issue_priority_reorder_service.py
from typing import List, Dict, Any
from collections import defaultdict

from models.common.logger import get_logger
from models.common.text_utils import build_issue_text
from models.issue_priority_commit import IssuePriorityModel, PriorityLevel
from models.issue_priority_commit.config import REORDER_USE_RULES, REORDER_BOOST_SCORE, REORDER_PENALTY_SCORE

logger = get_logger(__name__)


class IssuePriorityReorderService:
    """
    이슈 우선순위 재정렬 서비스 (순수 비즈니스 로직)
    
    입력: 이미 priority(HIGH/MED/LOW or 상/중/하)가 붙은 이슈 리스트
    처리: priority 그룹 유지 + 그룹 내부는 모델 score로 재정렬
    출력: HIGH -> MED -> LOW 순으로 병합된 리스트
    """

    def __init__(self):
        """모델 초기화"""
        self.model = IssuePriorityModel()

    # ---------- core pipeline ----------

    def reorder(self, issues: List[Dict[str, Any]], return_scores: bool = False) -> List[Dict[str, Any]]:
        if not issues:
            return []

        groups = self._group_by_priority(issues)
        for p in list(groups.keys()):
            groups[p] = self._sort_group(groups[p], return_scores)

        return self._merge(groups)
    
    def reorder_with_scores(self, issues: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], Dict[int, float]]:
        """
        재정렬과 함께 각 이슈의 점수 정보도 반환
        Returns: (재정렬된 이슈 리스트, {issueId: score} 딕셔너리)
        """
        if not issues:
            return [], {}
        
        # 점수 정보를 저장할 딕셔너리
        score_map = {}
        
        groups = self._group_by_priority(issues)
        for p in list(groups.keys()):
            # 각 그룹의 이슈에 대해 점수 계산 및 저장
            for issue in groups[p]:
                issue_id = issue.get("issueId")
                subject = issue.get("title")
                body = issue.get("body")
                score = self._score(subject, body)
                if issue_id is not None:
                    score_map[issue_id] = score
            
            groups[p] = self._sort_group(groups[p], return_scores=False)
        
        merged = self._merge(groups)
        return merged, score_map

    # ---------- helpers ----------

    def _group_by_priority(self, issues: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        groups = defaultdict(list)
        for issue in issues:
            # priority가 없으면 기본값 MEDIUM 사용
            p = issue.get("priority")
            if not p:
                p = PriorityLevel.MEDIUM
                issue["priority"] = p

            if isinstance(p, str):
                p_upper = p.upper()
                if p_upper == "HIGH":
                    p = PriorityLevel.HIGH
                elif p_upper == "MEDIUM" or p_upper == "MED":
                    p = PriorityLevel.MEDIUM
                elif p_upper == "LOW":
                    p = PriorityLevel.LOW
                else:
                    p = PriorityLevel.MEDIUM
                issue["priority"] = p
            groups[p].append(issue)
        return dict(groups)

    def _sort_group(self, issues: List[Dict[str, Any]], return_scores: bool) -> List[Dict[str, Any]]:
        scored = []
        for it in issues:
            subject = it.get("title")
            body = it.get("body")
            score = self._score(subject, body)
            out = dict(it)
            if return_scores:
                out["score"] = score
            scored.append((score, out))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [x[1] for x in scored]

    def _merge(self, groups: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
        merged: List[Dict[str, Any]] = []
        for p in (PriorityLevel.HIGH, PriorityLevel.MEDIUM, PriorityLevel.LOW):
            merged.extend(groups.get(p, []))
        return merged

    def _score(self, subject: str, body: str = "") -> float:
        # 텍스트 유효성 검증
        from models.common.text_utils import validate_issue_text, is_meaningless_text
        
        # 의미없는 텍스트는 낮은 점수 반환 (재정렬 시 뒤로 밀림)
        if is_meaningless_text(subject) or (body and is_meaningless_text(body)):
            logger.debug(f"의미없는 텍스트 감지 - 제목: '{subject[:20]}...', 기본 점수 반환")
            return 0.3
        
        text = build_issue_text(subject, body)
        score = self.model.predict_score(text)

        if not REORDER_USE_RULES:
            return score

        return self._apply_rules(score, subject, body)

    def _apply_rules(self, score: float, subject: str, body: str = "") -> float:
        text = build_issue_text(subject, body)

        if any(k in text for k in ["버그", "오류", "에러", "장애", "크래시", "실패"]):
            score += REORDER_BOOST_SCORE

        if any(k in text for k in ["개선", "제안", "문서", "리팩토링"]):
            score += REORDER_PENALTY_SCORE  # config 값이 음수면 내려감

        return score
    
    def reorder_issues(self, issues: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], Dict[int, float], List[int]]:
        """
        이슈를 재정렬하고 결과를 반환합니다.
        
        Args:
            issues: 재정렬할 이슈 리스트
        
        Returns:
            (재정렬된 이슈 리스트, {issueId: score} 딕셔너리, 재정렬된 issueId 리스트)
        """
        if not issues:
            return [], {}, []
        
        # 이슈 재정렬 (점수 정보 포함)
        reordered_issues, score_map = self.reorder_with_scores(issues)
        
        if len(reordered_issues) == 0:
            logger.warning("재정렬 결과가 비어있습니다.")
            return [], {}, []
        
        # 재정렬된 issueId 리스트 추출
        issue_ids = [issue.get("issueId") for issue in reordered_issues if issue.get("issueId") is not None]
        
        return reordered_issues, score_map, issue_ids
