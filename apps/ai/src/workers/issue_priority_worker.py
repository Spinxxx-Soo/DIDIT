# workers/issue_priority_worker.py
"""이슈 우선순위 처리 워커"""
import time
import signal
import sys
from typing import Optional
from services.issue_priority_label_service import IssuePriorityLabelService
from services.issue_priority_reorder_service import IssuePriorityReorderService
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
            result = self.label_service.process_from_redis()
            if result:
                logger.info(
                    "라벨링 작업 완료: issue_id=%s, priority=%s",
                    result.get("issue_id"),
                    result.get("priority")
                )
                return True
            return False
        except Exception as e:
            logger.error("라벨링 작업 처리 중 오류 발생: %s", str(e))
            return False
    
    def _process_reorder_queue(self) -> bool:
        """queue:issue:priority:sort 큐에서 작업을 처리합니다.
        
        Returns:
            작업이 처리되었으면 True, 없으면 False
        """
        try:
            result = self.reorder_service.process_from_redis()
            if result:
                logger.info(
                    "재정렬 작업 완료: userId=%s, projectId=%s, issues_count=%d",
                    result.get("userId"),
                    result.get("projectId"),
                    len(result.get("issues", []))
                )
                return True
            return False
        except Exception as e:
            logger.error("재정렬 작업 처리 중 오류 발생: %s", str(e))
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
            self.label_service.close()
            self.reorder_service.close()
        except Exception as e:
            logger.error("리소스 정리 중 오류 발생: %s", str(e))


def main():
    """워커 메인 함수"""
    worker = IssuePriorityWorker()
    worker.run(poll_interval=0.5)


if __name__ == "__main__":
    main()
