# api/main.py
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from api.routers import issue_priority, meeting_summary
from api.exceptions import BaseAPIException
from api.schemas.error import ErrorResponse
from common.settings import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="AI 모델 서비스 API",
    version=settings.APP_VERSION
)


# 커스텀 예외 핸들러
@app.exception_handler(BaseAPIException)
async def api_exception_handler(request: Request, exc: BaseAPIException):
    """API 예외 핸들러"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "message": exc.message,
            "code": exc.code
        }
    )


# FastAPI Validation Error 핸들러
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """요청 검증 에러 핸들러"""
    errors = exc.errors()
    message = "요청 데이터가 유효하지 않습니다"
    if errors:
        first_error = errors[0]
        field = ".".join(str(loc) for loc in first_error.get("loc", []))
        message = f"{field}: {first_error.get('msg', message)}"
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "message": message,
            "code": "VALIDATION_ERROR"
        }
    )


# 일반 예외 핸들러
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """일반 예외 핸들러"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "message": "서버 내부 오류가 발생했습니다",
            "code": "INTERNAL_SERVER_ERROR"
        }
    )


# 라우터 등록
app.include_router(issue_priority.router, prefix="/api/v1")
app.include_router(meeting_summary.router, prefix="/api/v1")


@app.get("/health")
async def health():
    """AI 체크 엔드포인트"""
    return {"status": "ok"}
