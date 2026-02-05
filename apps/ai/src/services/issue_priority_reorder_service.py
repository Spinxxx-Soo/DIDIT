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
            # priority가 없으면 기본값 MEDIUM 사용
            p = issue.get("priority")
            if not p:
                p = PriorityLevel.MEDIUM
                issue["priority"] = p  # 원본 딕셔너리에 priority 추가
            # priority 값을 PriorityLevel enum으로 변환
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
                issue["priority"] = p  # 변환된 값으로 업데이트
            groups[p].append(issue)
        return dict(groups)

    def _sort_group(self, issues: List[Dict[str, Any]], return_scores: bool) -> List[Dict[str, Any]]:
        scored = []
        for it in issues:
            subject = it.get("title")
            body = it.get("body")
            score = self._score(subject, body)

            # 점수 로그 출력
            logger.info(f"이슈 점수 계산 - 제목: '{subject}', 점수: {score:.4f}")

            out = dict(it)
            if return_scores:
                out["score"] = score
            scored.append((score, out))

        scored.sort(key=lambda x: x[0], reverse=True)
        titles_with_scores = [f"{s[1].get('title', 'N/A')}: {s[0]:.4f}" for s in scored]
        logger.info(f"그룹 내 정렬 완료: {len(scored)}개 이슈 (점수 순: {titles_with_scores})")
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
        issues = task.get("issues")
        return_scores = bool(task.get("return_scores", False))
        logger.info(f"재정렬 모델 redis : userID{user_id}, issues {issues}")

        if not user_id or not project_id:
            logger.error("invalid task (userId/projectId 없음): %s", task)
            return None

        if not issues:
            logger.error("invalid task(no issues): %s", issues)
            return None

        # 이슈 재정렬
        reordered_issues = self.reorder(issues, return_scores)
        
        logger.info(f"재정렬 완료: 입력 {len(issues)}개, 출력 {len(reordered_issues)}개")
        if len(reordered_issues) == 0:
            logger.warning("재정렬 결과가 비어있습니다. 입력 데이터 확인 필요")

        # 반환 형식에 맞게 변환: {"issue_id": .., "title": .., "body": ..}
        formatted_issues = []
        for issue in reordered_issues:
            formatted_issue = {
                "id": issue.get("issueId"),
                "title": issue.get("title"),
                "body": issue.get("body"),
                "priority": issue.get("priority")
            }
            formatted_issues.append(formatted_issue)
        
        logger.info(f"포맷팅 완료: {len(formatted_issues)}개 이슈")

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
