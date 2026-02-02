#ai/src/common/settings.py
from pydantic_settings import BaseSettings
from typing import Dict

class Settings(BaseSettings):
    """AI 서버 설정 클래스"""
    # 애플리케이션 정보
    APP_NAME: str = "AI Server"
    APP_VERSION: str = "1.0.0"
    
    #모델 설정
    MODEL_ISSUE_PRIORITY: str = "spinxxxx/git-issues-priority-ko"
    MODEL_ISSUE_PRIORITY_ISSUE: str = "issue_priority_issue"  # 단일 이슈 라벨링 모델
    USE_RULES: bool = True
    MAX_BATCH_SIZE: int = 100
    
    # 재정렬 후처리 규칙 설정
    REORDER_USE_RULES: bool = True  # 재정렬 후처리 규칙 사용 여부
    REORDER_BOOST_SCORE: float = 0.1  # 부스트 키워드 발견 시 추가 점수
    REORDER_PENALTY_SCORE: float = -0.05  # 페널티 키워드 발견 시 감점
    
    # python 서버 설정
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # 로깅 설정
    LOG_LEVEL: str = "INFO"
    
    # Redis 설정
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_TIMEOUT: int = 2  # 초 단위
    REDIS_DB: int = 0  # Redis 데이터베이스 번호
    
    # Redis 큐 이름 설정
    REDIS_QUEUE_ISSUE_SINGLE: str = "ai:issue:single"  # 단일 이슈 라벨링 작업 큐
    REDIS_QUEUE_ISSUE_BATCH: str = "ai:issue:batch"  # 이슈 목록 재정렬 작업 큐
    REDIS_RESULT_PREFIX: str = "ai:result:"  # 결과 저장 키 prefix
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # .env에 정의되지 않은 필드는 무시

# Settings 인스턴스 생성
settings = Settings()

# 기존 호환성을 위한 딕셔너리
MODEL_REGISTRY = {
    "issue_priority_commit": settings.MODEL_ISSUE_PRIORITY,
    "issue_priority_issue": settings.MODEL_ISSUE_PRIORITY_ISSUE
}
PRIORITY_ORDER = {}