# common/redis_client.py
"""Redis 클라이언트 유틸리티 모듈"""
import redis
import json
from typing import Optional, Any, Dict, List
from common.settings import settings
from models.common.logger import get_logger

logger = get_logger(__name__)


class RedisClient:
    """Redis 클라이언트 래퍼 클래스"""
    
    def __init__(self):
        """Redis 연결 초기화"""
        try:
            self.client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                db=settings.REDIS_DB,
                socket_timeout=settings.REDIS_TIMEOUT,
                decode_responses=True  # 문자열로 자동 디코딩
            )
            # 연결 테스트
            self.client.ping()
            logger.info("Redis 연결 성공: %s:%s", settings.REDIS_HOST, settings.REDIS_PORT)
        except redis.RedisError as e:
            logger.error("Redis 연결 실패: %s", str(e))
            raise
    
    def push_to_queue(self, queue_name: str, data: Dict[str, Any]) -> bool:
        """작업을 Redis 큐에 추가합니다.
        
        Args:
            queue_name: 큐 이름
            data: 작업 데이터 (JSON 직렬화 가능한 딕셔너리)
        
        Returns:
            성공 여부
        """
        try:
            json_data = json.dumps(data, ensure_ascii=False)
            self.client.rpush(queue_name, json_data)
            logger.debug("작업을 큐에 추가: %s", queue_name)
            return True
        except (redis.RedisError, json.JSONEncodeError) as e:
            logger.error("큐에 작업 추가 실패 (%s): %s", queue_name, str(e))
            return False
    
    def pop_from_queue(self, queue_name: str, timeout: int = 0) -> Optional[Dict[str, Any]]:
        """큐에서 작업을 가져옵니다.
        
        Args:
            queue_name: 큐 이름
            timeout: 대기 시간 (초), 0이면 즉시 반환
        
        Returns:
            작업 데이터 딕셔너리 또는 None
        """
        try:
            if timeout > 0:
                result = self.client.blpop(queue_name, timeout=timeout)
                if result is None:
                    return None
                _, json_data = result
            else:
                json_data = self.client.lpop(queue_name)
                if json_data is None:
                    return None
            
            data = json.loads(json_data)
            logger.debug("큐에서 작업 가져옴: %s", queue_name)
            return data
        except (redis.RedisError, json.JSONDecodeError) as e:
            logger.error("큐에서 작업 가져오기 실패 (%s): %s", queue_name, str(e))
            return None
    
    def set_result(self, key: str, data: Dict[str, Any], expire: Optional[int] = None) -> bool:
        """모델 결과를 Redis에 저장합니다.
        
        Args:
            key: 저장 키
            data: 결과 데이터
            expire: 만료 시간 (초), None이면 만료 없음
        
        Returns:
            성공 여부
        """
        try:
            json_data = json.dumps(data, ensure_ascii=False)
            if expire:
                self.client.setex(key, expire, json_data)
            else:
                self.client.set(key, json_data)
            logger.debug("결과 저장: %s", key)
            return True
        except (redis.RedisError, json.JSONEncodeError) as e:
            logger.error("결과 저장 실패 (%s): %s", key, str(e))
            return False
    
    def get_result(self, key: str) -> Optional[Dict[str, Any]]:
        """결과를 Redis에서 가져옵니다.
        
        Args:
            key: 저장 키
        
        Returns:
            결과 데이터 딕셔너리 또는 None
        """
        try:
            json_data = self.client.get(key)
            if json_data is None:
                return None
            data = json.loads(json_data)
            logger.debug("결과 가져옴: %s", key)
            return data
        except (redis.RedisError, json.JSONDecodeError) as e:
            logger.error("결과 가져오기 실패 (%s): %s", key, str(e))
            return None
    
    def delete_key(self, key: str) -> bool:
        """키를 삭제합니다.
        
        Args:
            key: 삭제할 키
        
        Returns:
            성공 여부
        """
        try:
            self.client.delete(key)
            logger.debug("키 삭제: %s", key)
            return True
        except redis.RedisError as e:
            logger.error("키 삭제 실패 (%s): %s", key, str(e))
            return False
    
    def close(self):
        """Redis 연결 종료"""
        try:
            self.client.close()
            logger.info("Redis 연결 종료")
        except redis.RedisError as e:
            logger.error("Redis 연결 종료 실패: %s", str(e))
