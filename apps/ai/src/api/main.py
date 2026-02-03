# api/main.py
"""최소한의 FastAPI 앱 - 운영용 엔드포인트만 제공"""
from fastapi import FastAPI
from common.settings import settings
import redis

app = FastAPI(
    title=settings.APP_NAME,
    description="AI 서버 운영용 엔드포인트",
    version=settings.APP_VERSION
)


@app.get("/health")
async def health():
    """헬스 체크 엔드포인트"""
    return {"status": "ok"}


@app.get("/health/redis")
async def health_redis():
    """Redis 연결 상태 확인"""
    try:
        client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            db=settings.REDIS_DB,
            socket_timeout=settings.REDIS_TIMEOUT
        )
        client.ping()
        return {"status": "ok", "redis": "connected"}
    except Exception as e:
        return {"status": "error", "redis": "disconnected", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False
    )
