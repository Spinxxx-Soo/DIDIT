# services/issue_priority_label_service.py
"""이슈 단일 우선순위 라벨링 서비스"""
from typing import Dict, Any, Optional
from models.issue_priority_issue.model import IssuePriorityIssueModel
from models.common.logger import get_logger
from common.redis_client import RedisClient
from common.settings import settings

logger = get_logger(__name__)


class IssuePriorityLabelService:
    """이슈 단일 우선순위 라벨링 서비스 클래스
    
    이슈 텍스트(제목, 본문)를 받아 우선순위 라벨("상", "중", "하")을 붙입니다.
    issue_priority_issue 모델을 사용합니다.
    """
    
    # 한글 우선순위 라벨 매핑
    PRIORITY_MAP = {
        "high": "상",
        "medium": "중",
        "low": "하",
        "HIGH": "상",
        "MEDIUM": "중",
        "LOW": "하"
    }
    
    def __init__(self, base_model_id: str = "unsloth/llama-3-8b-bnb-4bit",
                 adapter_path: str = "./final_lora_weights"):
        """서비스 초기화
        
        Args:
            base_model_id: 기본 모델 ID
            adapter_path: LoRA 어댑터 경로
        """
        logger.info("이슈 우선순위 라벨링 서비스 초기화 중...")
        self.model = IssuePriorityIssueModel(base_model_id, adapter_path)
        self.redis_client = RedisClient()
        logger.info("이슈 우선순위 라벨링 서비스 초기화 완료")
    
    def predict_label(self, subject: str, body: str = "") -> Dict[str, str]:
        """이슈에 우선순위 라벨을 예측합니다.
        
        Args:
            subject: 이슈 제목
            body: 이슈 본문
        
        Returns:
            {"priority": "상|중|하"} 형태의 딕셔너리
        """
        if not subject or not subject.strip():
            logger.warning("이슈 제목이 비어있습니다")
            return {"priority": "중"}  # 기본값
        
        # 모델 예측
        result = self.model.predict(title=subject, body=body or "")
        priority_en = result.get("priority", "medium")
        
        # 한글 라벨로 변환
        priority_ko = self.PRIORITY_MAP.get(priority_en, "중")
        
        logger.info("이슈 우선순위 라벨 예측 완료: %s", priority_ko)
        return {"priority": priority_ko}
    
    def process_from_redis(self) -> Optional[Dict[str, Any]]:
        """Redis 큐에서 작업을 가져와 처리하고 결과를 반환합니다.
        
        Returns:
            처리된 결과 딕셔너리 또는 None (작업이 없는 경우)
        """
        # 큐에서 작업 가져오기
        task = self.redis_client.pop_from_queue(
            settings.REDIS_QUEUE_ISSUE_LABEL,
            timeout=1  # 1초 대기
        )
        
        if task is None:
            return None
        
        try:
            # 작업 데이터 추출
            issue_id = task.get("issue_id")
            subject = task.get("subject") or task.get("title", "")
            body = task.get("body", "")
            
            if not issue_id:
                logger.error("작업에 issue_id가 없습니다: %s", task)
                return None
            
            # 우선순위 라벨 예측
            label_result = self.predict_label(subject, body)
            
            # 결과 구성
            result = {
                "issue_id": issue_id,
                "subject": subject,
                "body": body,
                "priority": label_result["priority"]
            }
            
            # Redis에 결과 저장
            result_key = f"{settings.REDIS_RESULT_PREFIX}issue:label:{issue_id}"
            self.redis_client.set_result(result_key, result, expire=3600)  # 1시간 만료
            
            logger.info("이슈 라벨링 작업 완료: issue_id=%s, priority=%s", issue_id, label_result["priority"])
            return result
            
        except Exception as e:
            logger.error("이슈 라벨링 작업 처리 중 오류 발생: %s", str(e))
            return None
    
    # def process_and_enqueue_next(self) -> Optional[Dict[str, Any]]:
    #     """Redis 큐에서 작업을 가져와 처리하고, 다음 단계 큐에 등록합니다.
        
    #     라벨링이 완료된 이슈는 재정렬 작업 큐에 등록할 수 있도록
    #     결과를 다시 Redis 작업 큐에 등록합니다.
        
    #     Returns:
    #         처리된 결과 딕셔너리 또는 None
    #     """
    #     result = self.process_from_redis()
        
    #     if result is None:
    #         return None
        
    #     # 다음 단계 큐에 등록 (재정렬 작업을 위해)
    #     # 이슈가 라벨링 완료되면 재정렬 큐에 등록할 수 있도록 결과를 큐에 추가
    #     # 실제로는 백엔드에서 이슈 목록을 모아서 재정렬 큐에 등록하는 것이 일반적이지만,
    #     # 여기서는 결과를 다시 큐에 등록하는 옵션을 제공합니다.
        
        return result
    
    def close(self):
        """리소스 정리"""
        try:
            self.redis_client.close()
        except Exception as e:
            logger.error("리소스 정리 중 오류 발생: %s", str(e))
