# apps/ai/src/services/issue_priority_label_service.py

import json
from typing import Optional, Dict, Any
from common.redis_client import RedisClient
from common.settings import settings
from models.issue_priority_issue.model import IssuePriorityIssueModel
from models.common.logger import get_logger

logger = get_logger(__name__)

class IssuePriorityLabelService:
    def __init__(self):
        """모델 및 Redis 초기화 (사용자님 요청 반영)"""
        # 1. 모델 로드 (여기서 Llama-3가 메모리에 올라갑니다)
        self.model = IssuePriorityIssueModel()
        # 2. Redis 연결 (RedisClient 사용)
        self.redis = RedisClient()

    def predict(self, subject: str, body: str = "") -> Dict[str, Any]:
        """모델에게 분석 요청"""
        return self.model.predict(title=subject, body=body)

    def process_from_redis(self) -> Optional[Dict[str, Any]]:
        """Redis → 예측 → Redis (전체 프로세스)"""

        # [1] 레디스에서 값 가져오기 (pop_from_queue 사용)
        # settings에 정의된 'queue:issue:priority:single' 큐를 사용합니다.
        task = self.redis.pop_from_queue(
            settings.REDIS_QUEUE_ISSUE_SINGLE, 
            timeout=1
        )
        
        if not task:
            return None

        # 데이터 추출 (백엔드 필드명 userId, issueId 등 대응)
        project_id = task.get("projectId")
        issue_id = task.get("issueId")  # Java의 issueId와 매칭
        user_id = task.get("userId")    # Java의 userId와 매칭
        title = task.get("title")
        body = task.get("body", "")
        
        logger.info(f" 모델이 받는 이슈 등록 - pjId : {project_id}, 이슈ID: {issue_id}, 유저ID {user_id}, 제목:{title}, 내용:{body}")

        if not issue_id:
            logger.error("잘못된 task 수신: issueId가 없습니다.")
            return None

        # [2] 모델 추론 (우리가 만든 15개 예시 프롬프트 작동)
        prediction = self.predict(title, body)
        priority = prediction["priority"]

        # 결과 데이터 구성
        result_data = {
            "projectId": project_id,
            "userId": user_id,
            "issueId": issue_id,
            "priority": priority
        }

        # [3] 레디스에 값 넣기 (set_result 사용)
        # 결과 키: issue_priority_result:123 형식
        result_key = f"issue_priority_result:{issue_id}"
        self.redis.set_result(
            result_key, 
            result_data, 
            expire=3600  # 1시간 동안 유지
        )

        # [4] 백엔드 실시간 알림 (Publish)
        # Redis Pub/Sub을 통해 백엔드에게 "작업 끝났다!"고 즉시 알립니다.
        self.redis.client.publish(
            settings.REDIS_RESULT_TOPIC_SINGLE, 
            json.dumps(result_data)
        )

        logger.info(f"✅ 처리 완료: 제목- {title} 아이디 {issue_id}-> {priority}")
        return result_data

    def close(self):
        """종료 시 리소스 정리"""
        self.redis.close()
