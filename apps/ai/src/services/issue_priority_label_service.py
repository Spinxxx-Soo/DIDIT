# services/issue_priority_label_service.py
from typing import Optional, Dict, Any
from common.redis_client import RedisClient
from common.settings import settings
from models.issue_priority_issue.model import IssuePriorityIssueModel
from models.common.logger import get_logger

logger = get_logger(__name__)


class IssuePriorityLabelService:
    def __init__(self):
        self.model = IssuePriorityIssueModel()
        self.redis = RedisClient()

    def predict(self, subject: str, body: str = "") -> str:
        """이슈 우선순위 예측 (상/중/하)"""
        result = self.model.predict(title=subject, body=body)
        return result.get("priority", "MEDIUM")

    def process_from_redis(self) -> Optional[Dict[str, Any]]:
        """Redis → 예측 → Redis"""

        #Redis 가져오기
        task = self.redis.pop_from_queue(
            settings.REDIS_QUEUE_ISSUE_SINGLE,
            timeout=1
        )
        if not task:
            return None

        issue_id = task.get("issue_id")
        subject = task.get("subject")
        body = task.get("body", "")

        if not issue_id or not subject:
            logger.error("잘못된 task: %s", task)
            return None

        priority = self.predict(subject, body)

        result = {
            "issue_id": issue_id,
            "priority": priority
        }

        #redis 모델 결과 전송
        self.redis.set_result(
            f"{settings.REDIS_RESULT_TOPIC_SINGLE}",
            result,
            expire=3600
        )

        logger.info("이슈 라벨링 완료 issue_id=%s priority=%s", issue_id, priority)
        return result

    def close(self):
        self.redis.close()
