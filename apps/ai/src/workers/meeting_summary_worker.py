# workers/meeting_summary_worker.py
"""회의 요약 처리 워커"""
import time
import signal
from typing import Optional

from services.meeting_summary_service import MeetingSummaryService
from common.redis_client import RedisClient
from common.settings import settings
from models.common.logger import get_logger

logger = get_logger(__name__)


class MeetingSummaryWorker:
    """회의 요약 처리 워커 클래스
    
    Redis 큐에서 회의 요약 작업을 가져와 처리합니다:
    - MeetingSummaryService: 회의 파일을 처리하여 요약 생성
    """
    
    def __init__(self):
        """워커 초기화"""
        logger.info("회의 요약 워커 초기화 중...")
        self.summary_service = MeetingSummaryService()
        self.redis = RedisClient()
        self.running = False
        logger.info("회의 요약 워커 초기화 완료")
    
    def _signal_handler(self, signum, frame):
        """시그널 핸들러 (종료 신호 처리)"""
        logger.info("종료 신호 수신, 워커 종료 중...")
        self.running = False
    
    def _process_summary_queue(self) -> bool:
        """queue:meeting:summary 큐에서 작업을 처리합니다.
        
        Returns:
            작업이 처리되었으면 True, 없으면 False
        """
        try:
            # 1. Redis에서 작업 가져오기
            task = self.redis.pop_from_queue(settings.REDIS_QUEUE_MEETING_SUMMARY, timeout=1)
            
            if not task:
                return False
            
            # meeting_file 형식: {"meetingID": 123, "filePath": "/mnt/shared/meetings/123.webm"}
            meeting_file = task.get("meeting_file") or task
            
            if not meeting_file:
                logger.error("잘못된 task (meeting_file 없음): %s", task)
                return False
            
            # 2. Service를 통한 비즈니스 로직 처리
            result = self.summary_service.process_meeting_summary_model(meeting_file)
            
            if not result:
                logger.error("회의 요약 처리 실패: meeting_file=%s", meeting_file)
                return False
            
            # 3. 결과를 Redis에 저장
            result_key = f"{settings.REDIS_RESULT_TOPIC_MEETING_SUMMARY}:{result.get('meetingId')}"
            self.redis.set_result(result_key, result, expire=3600)
            
            logger.info(
                "회의 요약 작업 완료: meetingId=%s, status=%s",
                result.get("meetingId"),
                result.get("status")
            )
            return True
            
        except Exception as e:
            logger.error("회의 요약 작업 처리 중 오류 발생: %s", str(e))
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
        logger.info("회의 요약 워커 시작 (poll_interval=%.2f초)", poll_interval)
        
        processed_count = 0
        
        try:
            while self.running:
                # queue:meeting:summary 큐 처리
                if self._process_summary_queue():
                    processed_count += 1
                
                # 작업이 없으면 잠시 대기
                time.sleep(poll_interval)
        
        except KeyboardInterrupt:
            logger.info("키보드 인터럽트로 워커 종료")
        except Exception as e:
            logger.error("워커 실행 중 오류 발생: %s", str(e))
        finally:
            self.shutdown()
            logger.info("워커 종료 - 처리된 작업: %d개", processed_count)
    
    def shutdown(self):
        """워커 종료 및 리소스 정리"""
        logger.info("워커 리소스 정리 중...")
        try:
            self.redis.close()
            logger.info("Redis 연결 종료")
        except Exception as e:
            logger.error("리소스 정리 중 오류 발생: %s", str(e))


def main():
    """워커 메인 함수"""
    worker = MeetingSummaryWorker()
    worker.run(poll_interval=0.5)


if __name__ == "__main__":
    main()
