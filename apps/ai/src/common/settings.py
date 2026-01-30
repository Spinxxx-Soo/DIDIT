#ai/src/common/settings.py
from pydantic_settings import BaseSettings
from typing import Dict

class Settings(BaseSettings):
    """AI 서버 설정 클래스"""
    # 애플리케이션 정보
    APP_NAME: str = "AI Server"
    APP_VERSION: str = "1.0.0"
    
    # 모델 설정
    # MODEL_ISSUE_PRIORITY_COMMIT: str = "spinxxxx/git-issues-priority-ko"
    # USE_RULES: bool = True
    # MAX_BATCH_SIZE: int = 100
    
    # 서버 설정
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # # Redis 설정 - 아직 안함 해야함.
    # REDIS_HOST: str = "localhost"
    # REDIS_PORT: int = 6379
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Settings 인스턴스 생성
settings = Settings()

# 기존 호환성을 위한 딕셔너리
MODEL_REGISTRY = {
    "issue_priority_commit": settings.MODEL_ISSUE_PRIORITY_COMMIT
}
PRIORITY_ORDER = {}