# api/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from service.priority_predictor import PriorityPredictorService

app = FastAPI()

# 서비스 초기화 (앱 시작 시 한 번만)
predictor = PriorityPredictorService(
    model_name="spinxxxx/git-issues-priority-ko",
    use_rules=True
)


class IssueRequest(BaseModel):
    subject: str
    body: Optional[str] = ""


class IssueBatchRequest(BaseModel):
    issues: List[IssueRequest]


@app.post("/predict")
async def predict_priority(issue: IssueRequest):
    """단일 이슈 우선순위 예측"""
    result = predictor.predict(
        subject=issue.subject,
        body=issue.body,
        return_score=True
    )
    return result


@app.post("/predict/batch")
async def predict_priority_batch(request: IssueBatchRequest):
    """배치 이슈 우선순위 예측"""
    issues = [{"subject": i.subject, "body": i.body or ""}
              for i in request.issues]
    results = predictor.predict_batch(issues, return_scores=True)
    return {"results": results}


@app.get("/health")
async def health():
    return {"status": "ok"}
