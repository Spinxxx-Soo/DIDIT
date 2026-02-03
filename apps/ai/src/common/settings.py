#ai/src/common/settings.py
from pydantic_settings import BaseSettings
from typing import Dict

class Settings(BaseSettings):
    """AI 서버 설정 클래스"""
    # 애플리케이션 정보
    APP_NAME: str = "AI Server"
    APP_VERSION: str = "1.0.0"
        
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
    
    # Redis 큐 이름 설정 (백엔드 → AI 작업 요청)
    REDIS_QUEUE_ISSUE_SINGLE: str = "queue:issue:priority:single"  # 단일 이슈 라벨링 작업 큐
    REDIS_QUEUE_ISSUE_BATCH: str = "queue:issue:priority:sort"  # 이슈 목록 재정렬 작업 큐
    REDIS_QUEUE_MEETING_SUMMARY: str = "queue:meeting:summary"  # 회의 요약 작업 큐
    
    # Redis 결과 토픽 설정 (AI → 백엔드 결과 전송)
    REDIS_RESULT_TOPIC_SINGLE: str = "issue:priority:result_topic"  # 단일 이슈 분석 결과 토픽
    REDIS_RESULT_TOPIC_BATCH: str = "issue:priority:result_topic_sort"  # 배치 이슈 정렬 결과 토픽
    REDIS_RESULT_TOPIC_MEETING_SUMMARY: str = "meeting:summary:result"  # 회의 요약 결과 토픽
    
    # Whisper API 프록시 설정
    WHISPER_PROXY_URL: str = "https://gms.ssafy.io/gmsapi/api.openai.com"  # Whisper 프록시 서버 URL (SDK가 자동으로 /v1 추가)
    GMS_KEY: str = ""  # GMS API 키 (환경변수에서 로드)
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # .env에 정의되지 않은 필드는 무시

# Settings 인스턴스 생성
settings = Settings()
