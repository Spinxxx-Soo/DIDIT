# api/schemas/error.py
from pydantic import BaseModel
from typing import Optional


class ErrorResponse(BaseModel):
    """에러 응답 스키마"""
    message: str
    code: str


class ErrorCode:
    """에러 코드 상수"""
    # 400 Bad Request
    VALIDATION_ERROR = "VALIDATION_ERROR"
    BAD_REQUEST = "BAD_REQUEST"
    
    # 401 Unauthorized
    UNAUTHORIZED = "UNAUTHORIZED"
    
    # 403 Forbidden
    FORBIDDEN = "FORBIDDEN"
    
    # 404 Not Found
    NOT_FOUND = "NOT_FOUND"
    MODEL_NOT_FOUND = "MODEL_NOT_FOUND"
    
    # 409 Conflict
    CONFLICT = "CONFLICT"
    
    # 500 Internal Server Error
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    MODEL_LOAD_ERROR = "MODEL_LOAD_ERROR"
    PREDICTION_ERROR = "PREDICTION_ERROR"
