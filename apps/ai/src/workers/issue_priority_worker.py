# workers/issue_priority_worker.py
"""이슈 우선순위 처리 워커"""
import time
import signal
import sys
import json
from typing import Optional
from services.issue_priority_label_service import IssuePriorityLabelService
from services.issue_priority_reorder_service import IssuePriorityReorderService
from common.redis_client import RedisClient
from models.common.logger import get_logger
from common.settings import settings

logger = get_logger(__name__)


class IssuePriorityWorker:
    """이슈 우선순위 처리 워커 클래스
    
    Redis 큐에서 작업을 가져와 두 서비스를 통해 처리합니다:
    1. IssuePriorityLabelService: 단일 이슈에 라벨 붙이기
    2. IssuePriorityReorderService: 이슈 목록 재정렬
    """
    
    def __init__(self):
        """워커 초기화"""
        logger.info("이슈 우선순위 워커 초기화 중...")
        self.label_service = IssuePriorityLabelService()
        self.reorder_service = IssuePriorityReorderService()
        self.redis = RedisClient()  # Worker에서 Redis 관리
        self.running = False
        logger.info("이슈 우선순위 워커 초기화 완료")
    
    def _signal_handler(self, signum, frame):
        """시그널 핸들러 (종료 신호 처리)"""
        logger.info("종료 신호 수신, 워커 종료 중...")
        self.running = False
    
    def _process_label_queue(self) -> bool:
        """queue:issue:priority:single 큐에서 작업을 처리합니다.
        
        Returns:
            작업이 처리되었으면 True, 없으면 False
        """
        try:
            # [1] Redis에서 작업 가져오기
            task = self.redis.pop_from_queue(
                settings.REDIS_QUEUE_ISSUE_SINGLE,
                timeout=1
            )
            
            if not task:
                return False
            
            # [2] 데이터 추출
            issue_id = task.get("issueId")
            user_id = task.get("userId")
            title = task.get("title")
            body = task.get("body", "")
            
            if not issue_id:
                logger.error("잘못된 task 수신: issueId가 없습니다.")
                return False
            
            # [3] Service를 통한 비즈니스 로직 처리
            priority = self.label_service.analyze_issue(title, body)
            
            # [4] 결과 데이터 구성
            result_data = {
                "userId": user_id,
                "issueId": issue_id,
                "priority": priority
            }
            
            # [5] Redis에 결과 저장
            result_key = f"issue_priority_result:{issue_id}"
            self.redis.set_result(
                result_key,
                result_data,
                expire=3600
            )
            
            # [6] Redis Pub/Sub으로 발행
            self.redis.client.publish(
                settings.REDIS_RESULT_TOPIC_SINGLE,
                json.dumps(result_data)
            )
            
            logger.info(
                "라벨링 작업 완료: issue_id=%s, priority=%s, title='%s'",
                issue_id,
                priority,
                title[:30] if title else "N/A"
            )
            return True
            
        except Exception as e:
            logger.error("라벨링 작업 처리 중 오류 발생: %s", str(e), exc_info=True)
            return False
    
    def _process_reorder_queue(self) -> bool:
        """queue:issue:priority:sort 큐에서 작업을 처리합니다.
        
        Returns:
            작업이 처리되었으면 True, 없으면 False
        """
        try:
            # [1] Redis에서 작업 가져오기
            task = self.redis.pop_from_queue(
                settings.REDIS_QUEUE_ISSUE_BATCH,
                timeout=1
            )
            
            if not task:
                return False
            
            # [2] 데이터 추출
            user_id = task.get("userId")
            project_id = task.get("projectId")
            issues = task.get("issues")
            
            if not user_id or not project_id:
                logger.error("invalid task (userId/projectId 없음): %s", task)
                return False
            
            if not issues:
                logger.error("invalid task(no issues): %s", issues)
                return False
            
            # [3] Service를 통한 비즈니스 로직 처리
            reordered_issues, score_map, issue_ids = self.reorder_service.reorder_issues(issues)
            
            if not issue_ids:
                logger.warning("재정렬 결과가 비어있습니다.")
                return False
            
            # [4] 결과 데이터 구성
            result = {
                "userId": user_id,
                "projectId": project_id,
                "issueIds": issue_ids
            }
            
            # [5] 로깅
            logger.info("=" * 80)
            logger.info("📤 백엔드로 전송할 최종 Result 값")
            logger.info("재정렬된 이슈 ID 목록 (점수 순):")
            for idx, issue_id in enumerate(issue_ids, 1):
                original_issue = next((iss for iss in reordered_issues if iss.get("issueId") == issue_id), None)
                score = score_map.get(issue_id, None)
                score_str = f"{score:.4f}" if score is not None else "N/A"
                title = original_issue.get("title", "N/A") if original_issue else "N/A"
                priority = original_issue.get("priority", "N/A") if original_issue else "N/A"
                logger.info(f"  [{idx}] id={issue_id}, title='{title}', priority={priority}, score={score_str}")
            logger.info("-" * 80)
            logger.info(f"재정렬된 ID 리스트: {issue_ids}")
            logger.info("전체 Result JSON:")
            try:
                result_json = json.dumps(result, ensure_ascii=False, indent=2)
                logger.info(f"\n{result_json}")
            except Exception as e:
                logger.warning(f"JSON 직렬화 실패: {e}")
                logger.info(f"Result 객체: {result}")
            logger.info("=" * 80)
            
            # [6] Redis에 결과 저장 (백업용)
            key = f"{settings.REDIS_RESULT_TOPIC_BATCH}"
            self.redis.set_result(key, result, expire=3600)
            logger.info(f"Redis에 저장 완료 (key: {key}, expire: 3600초)")
            
            # [7] Redis Pub/Sub으로 발행
            pubsub_message = json.dumps(result, ensure_ascii=False)
            subscribers = self.redis.client.publish(
                settings.REDIS_RESULT_TOPIC_BATCH,
                pubsub_message
            )
            logger.info(
                "재정렬 작업 완료: userId=%s, projectId=%s, issueIds_count=%d, subscribers=%d",
                user_id,
                project_id,
                len(issue_ids),
                subscribers
            )
            return True
            
        except Exception as e:
            logger.error("재정렬 작업 처리 중 오류 발생: %s", str(e), exc_info=True)
            return False
    
    def run(self, poll_interval: float = 0.5):
        """워커를 실행합니다.
        
        Args:
            poll_interval: 큐 폴링 간격 (초)
        """
        # 시그널 핸들러 등록
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        self.running = True
        logger.info("이슈 우선순위 워커 시작 (poll_interval=%.2f초)", poll_interval)
        
        label_processed = 0
        reorder_processed = 0
        
        try:
            while self.running:
                # queue:issue:priority:single 큐 처리
                if self._process_label_queue():
                    label_processed += 1
                
                # queue:issue:priority:sort 큐 처리
                if self._process_reorder_queue():
                    reorder_processed += 1
                
                # 작업이 없으면 잠시 대기
                time.sleep(poll_interval)
        
        except KeyboardInterrupt:
            logger.info("키보드 인터럽트로 워커 종료")
        except Exception as e:
            logger.error("워커 실행 중 오류 발생: %s", str(e))
        finally:
            self.shutdown()
            logger.info(
                "워커 종료 - 라벨링: %d개, 재정렬: %d개 처리됨",
                label_processed,
                reorder_processed
            )
    
    def shutdown(self):
        """워커 종료 및 리소스 정리"""
        logger.info("워커 리소스 정리 중...")
        try:
            self.redis.close()
        except Exception as e:
            logger.error("리소스 정리 중 오류 발생: %s", str(e))


def main():
    """워커 메인 함수"""
    worker = IssuePriorityWorker()
    worker.run(poll_interval=0.5)


if __name__ == "__main__":
    main()
