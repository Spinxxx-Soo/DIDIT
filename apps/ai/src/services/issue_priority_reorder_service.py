# services/issue_priority_reorder_service.py
from typing import List, Dict, Any, Optional
from collections import defaultdict
import json

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
        issues = task.get("issues")
        return_scores = bool(task.get("return_scores", False))
        logger.info(f"재정렬 모델 redis : userID{user_id}, issues {issues}")

        if not user_id or not project_id:
            logger.error("invalid task (userId/projectId 없음): %s", task)
            return None

        if not issues:
            logger.error("invalid task(no issues): %s", issues)
            return None

        # 이슈 재정렬 (점수 정보 포함)
        reordered_issues, score_map = self.reorder_with_scores(issues)
        
        if len(reordered_issues) == 0:
            logger.warning("재정렬 결과가 비어있습니다. 입력 데이터 확인 필요")
            return None

        # 재정렬된 issueId 리스트 추출
        issue_ids = [issue.get("issueId") for issue in reordered_issues if issue.get("issueId") is not None]
        
        # 최종 결과 형식 (백엔드가 기대하는 형식: userId, projectId, issueIds)
        result = {
            "userId": user_id,
            "projectId": project_id,
            "issues": formatted_issues
        }
        
        # 최종 result 값 상세 확인 로깅 (점수 정보 포함)
        logger.info("=" * 80)
        logger.info("📤 백엔드로 전송할 최종 Result 값")
        logger.info("=" * 80)
        logger.info(f"userId: {result['userId']}")
        logger.info(f"projectId: {result['projectId']}")
        logger.info(f"issues 개수: {len(result['issues'])}")
        logger.info("-" * 80)
        logger.info("이슈 목록 상세 (점수 포함):")
        for idx, issue in enumerate(result['issues'], 1):
            issue_id = issue.get('id')
            score = score_map.get(issue_id, None)
            score_str = f"{score:.4f}" if score is not None else "N/A"
            logger.info(f"  [{idx}] id={issue_id}, title='{issue.get('title')}', "
                       f"priority={issue.get('priority')}, score={score_str}, "
                       f"body='{issue.get('body', '')[:50]}...'")
        logger.info("-" * 80)
        logger.info("전체 Result JSON:")
        try:
            result_json = json.dumps(result, ensure_ascii=False, indent=2)
            logger.info(f"\n{result_json}")
        except Exception as e:
            logger.warning(f"JSON 직렬화 실패: {e}")
            logger.info(f"Result 객체: {result}")
        logger.info("=" * 80)
        
        # 결과를 Redis에 저장
        key = f"{settings.REDIS_RESULT_TOPIC_BATCH}"
        self.redis.set_result(key, result, expire=3600)
        logger.info(f"✅ Redis에 저장 완료 (key: {key}, expire: 3600초)")

        return result

    def close(self):
        self.redis.close()
