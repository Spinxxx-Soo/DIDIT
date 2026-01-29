# api/routers/issue_priority.py
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
from services.issue_priority_service import IssuePriorityService
from api.exceptions import (
    ValidationException,
    InternalServerException,
    BadRequestException
)
from api.schemas.error import ErrorCode

router = APIRouter(prefix="/issue-priority", tags=["issue-priority"])

# 서비스 초기화 (앱 시작 시 한 번만)
service = IssuePriorityService(use_rules=True)


class IssueRequest(BaseModel):
    subject: str = Field(..., min_length=1, description="이슈 제목")
    body: Optional[str] = Field(default="", description="이슈 본문")


class IssueBatchRequest(BaseModel):
    issues: List[IssueRequest] = Field(..., min_items=1, description="예측할 이슈 목록")


@router.post("/predict")
async def predict_priority(issue: IssueRequest):
    """단일 이슈 우선순위 예측"""
    try:
        if not issue.subject or not issue.subject.strip():
            raise ValidationException("제목은 필수입니다")
        
        result = service.predict(
            subject=issue.subject,
            body=issue.body or "",
            return_score=True
        )
        return result
    except Exception as e:
        if isinstance(e, (ValidationException, BadRequestException)):
            raise
        raise InternalServerException(
            f"예측 중 오류가 발생했습니다: {str(e)}",
            ErrorCode.PREDICTION_ERROR
        )


@router.post("/predict/batch")
async def predict_priority_batch(request: IssueBatchRequest):
    """목록 이슈 우선순위 예측"""
    try:
        if not request.issues or len(request.issues) == 0:
            raise ValidationException("최소 1개 이상의 이슈가 필요합니다")
        
        #모델은 예측 개수 상관 X, 서버 처리에서 우려되어 제한 O -> 추후 수정 필요
        if len(request.issues) > 100:
            raise BadRequestException("한 번에 최대 100개까지 예측 가능합니다")
        
        issues = [{"subject": issue.subject, "body": issue.body or ""}
                  for issue in request.issues]
        results = service.predict_batch(issues, return_scores=True)
        return {"results": results}
    
    except Exception as e:
        if isinstance(e, (ValidationException, BadRequestException)):
            raise
        raise InternalServerException(
            f"배치 예측 중 오류가 발생했습니다: {str(e)}",
            ErrorCode.PREDICTION_ERROR
        )
