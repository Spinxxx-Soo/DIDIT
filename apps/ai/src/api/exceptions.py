# api/exceptions.py
from fastapi import HTTPException, status
from api.schemas.error import ErrorCode


class BaseAPIException(HTTPException):
    """기본 API 예외 클래스"""
    
    def __init__(self, status_code: int, message: str, code: str):
        super().__init__(status_code=status_code, detail=message)
        self.message = message
        self.code = code


class BadRequestException(BaseAPIException):
    """400 Bad Request 예외"""
    
    def __init__(self, message: str, code: str = ErrorCode.BAD_REQUEST):
        super().__init__(status.HTTP_400_BAD_REQUEST, message, code)


class ValidationException(BaseAPIException):
    """400 Validation Error 예외"""
    
    def __init__(self, message: str):
        super().__init__(status.HTTP_400_BAD_REQUEST, message, ErrorCode.VALIDATION_ERROR)


class UnauthorizedException(BaseAPIException):
    """401 Unauthorized 예외"""
    
    def __init__(self, message: str = "인증이 필요합니다"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, message, ErrorCode.UNAUTHORIZED)


class ForbiddenException(BaseAPIException):
    """403 Forbidden 예외"""
    
    def __init__(self, message: str = "접근 권한이 없습니다"):
        super().__init__(status.HTTP_403_FORBIDDEN, message, ErrorCode.FORBIDDEN)


class NotFoundException(BaseAPIException):
    """404 Not Found 예외"""
    
    def __init__(self, message: str, code: str = ErrorCode.NOT_FOUND):
        super().__init__(status.HTTP_404_NOT_FOUND, message, code)


class ConflictException(BaseAPIException):
    """409 Conflict 예외"""
    
    def __init__(self, message: str):
        super().__init__(status.HTTP_409_CONFLICT, message, ErrorCode.CONFLICT)


class InternalServerException(BaseAPIException):
    """500 Internal Server Error 예외"""
    
    def __init__(self, message: str, code: str = ErrorCode.INTERNAL_SERVER_ERROR):
        super().__init__(status.HTTP_500_INTERNAL_SERVER_ERROR, message, code)
