# api/routers/meeting_summary.py
"""
1. api - 백엔드 레디스에서 파일 받아오기
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from typing import Optional
from services.meeting_summary_service import MeetingSummaryService
from api.exceptions import (
    ValidationException,
    InternalServerException,
    BadRequestException
)
from api.schemas.error import ErrorCode

router = APIRouter(prefix="/meeting-summary", tags=["meeting-summary"])

# 서비스 초기화 (앱 시작 시 한 번만)
service = MeetingSummaryService()


class MeetingSummaryRequest(BaseModel):
    meeting_id: int = Field(..., description="회의 ID")
    file_key: Optional[str] = Field(default=None, description="레디스 파일 키 (선택사항)")


@router.post("/process")
async def process_meeting(request: MeetingSummaryRequest):
    """
    회의 파일을 처리하여 요약을 생성합니다.
    
    프로세스:
    1. 백엔드 레디스에서 파일 받아오기
    2. FFmpeg 처리
    3. Whisper STT 실행
    4. 모델 실행 (제미나이 요약)
    5. 결과 반환
    """
    try:
        if not request.meeting_id or request.meeting_id <= 0:
            raise ValidationException("유효한 회의 ID가 필요합니다")
        
        result = await service.process_meeting_file(
            meeting_id=request.meeting_id,
            file_key=request.file_key
        )
        return result
        
    except Exception as e:
        if isinstance(e, (ValidationException, BadRequestException)):
            raise
        raise InternalServerException(
            f"회의 파일 처리 중 오류가 발생했습니다: {str(e)}",
            ErrorCode.PREDICTION_ERROR
        )


@router.get("/process")
async def process_meeting_get(
    meeting_id: int = Query(..., description="회의 ID"),
    file_key: Optional[str] = Query(default=None, description="레디스 파일 키")
):
    """
    GET 방식으로 회의 파일 처리 (동일한 기능)
    """
    try:
        if not meeting_id or meeting_id <= 0:
            raise ValidationException("유효한 회의 ID가 필요합니다")
        
        result = await service.process_meeting_file(
            meeting_id=meeting_id,
            file_key=file_key
        )
        return result
        
    except Exception as e:
        if isinstance(e, (ValidationException, BadRequestException)):
            raise
        raise InternalServerException(
            f"회의 파일 처리 중 오류가 발생했습니다: {str(e)}",
            ErrorCode.PREDICTION_ERROR
        )
