# services/issue_priority_reorder_service.py
from typing import List, Dict, Any, Optional
from collections import defaultdict

from common.redis_client import RedisClient
from common.settings import settings
from models.common.logger import get_logger
from models.common.text_utils import build_issue_text
from models.issue_priority_commit import IssuePriorityModel, PriorityLevel
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
            p = issue.get("priority") #정규화 안하고 바로 저장된 중요도 쓰기
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

        issues = task.get("issues") or []
        return_scores = bool(task.get("return_scores", False))

        if not issues:
            logger.error("invalid task(no issues): %s", task)
            return None

        result = {"result": self.reorder(issues, return_scores)}
        key = f"{settings.REDIS_RESULT_TOPIC_BATCH}"
        self.redis.set_result(key, result, expire=3600)

        return result

    def close(self):
        self.redis.close()
