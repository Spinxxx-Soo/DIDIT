# services/issue_priority_reorder_service.py
from typing import List, Dict, Any, Optional
from collections import defaultdict

from common.redis_client import RedisClient
from common.settings import settings
from models.common.logger import get_logger
from models.common.text_utils import build_issue_text
from models.issue_priority_commit import IssuePriorityModel, PriorityLevel, PRIORITY_LABEL_MAP
from models.issue_priority_commit.config import REORDER_USE_RULES, REORDER_BOOST_SCORE, REORDER_PENALTY_SCORE

logger = get_logger(__name__)


class IssuePriorityReorderService:
    """
    입력: 이미 priority(HIGH/MED/LOW or 상/중/하)가 붙은 이슈 리스트
    처리: priority 그룹 유지 + 그룹 내부는 모델 score로 재정렬
    출력: HIGH -> MED -> LOW 순으로 병합된 리스트
    """

    def __init__(self):
        self.model = IssuePriorityModel()
        self.redis = RedisClient()

    # ---------- core pipeline ----------

    def reorder(self, issues: List[Dict[str, Any]], return_scores: bool = False) -> List[Dict[str, Any]]:
        if not issues:
            return []

        groups = self._group_by_priority(issues)
        for p in list(groups.keys()):
            groups[p] = self._sort_group(groups[p], return_scores)

        return self._merge(groups)

    # ---------- helpers ----------

    def _group_by_priority(self, issues: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        groups = defaultdict(list)
        for issue in issues:
            p = issue.get("priority")
            if p:
                groups[p].append(issue)
        return dict(groups)

    def _sort_group(self, issues: List[Dict[str, Any]], return_scores: bool) -> List[Dict[str, Any]]:
        scored = []
        for it in issues:
            subject = it.get("subject")
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

    # ---------- redis entry ----------

    def process_from_redis(self) -> Optional[Dict[str, Any]]:
        task = self.redis.pop_from_queue(settings.REDIS_QUEUE_ISSUE_BATCH, timeout=1)
        if not task:
            return None

        # Redis에서 받은 데이터 추출
        user_id = task.get("userId")
        project_id = task.get("projectId")
        issues = task.get("issues") or []
        return_scores = bool(task.get("return_scores", False))

        if not user_id or not project_id:
            logger.error("invalid task (userId/projectId 없음): %s", task)
            return None

        if not issues:
            logger.error("invalid task(no issues): %s", task)
            return None

        # 이슈 재정렬
        reordered_issues = self.reorder(issues, return_scores)

        # 반환 형식에 맞게 변환: {"issue_id": .., "title": .., "body": ..}
        formatted_issues = []
        for issue in reordered_issues:
            formatted_issue = {
                "issue_id": issue.get("issue_id") or issue.get("id"),
                "title": issue.get("title") or issue.get("subject"),
                "body": issue.get("body") or ""
            }
            # priority가 있으면 포함
            if "priority" in issue:
                formatted_issue["priority"] = issue["priority"]
            # score가 있으면 포함 (return_scores가 True인 경우)
            if return_scores and "score" in issue:
                formatted_issue["score"] = issue["score"]
            
            formatted_issues.append(formatted_issue)

        # 최종 결과 형식
        result = {
            "userId": user_id,
            "projectId": project_id,
            "issues": formatted_issues
        }
        
        # 결과를 Redis에 저장
        key = f"{settings.REDIS_RESULT_TOPIC_BATCH}"
        self.redis.set_result(key, result, expire=3600)

        return result

    def close(self):
        self.redis.close()
