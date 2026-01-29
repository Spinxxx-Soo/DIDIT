#response
from typing import Optional, List
from pydantic import BaseModel, Field

class IssueItem(BaseModel):
    id: int = Field()
    issueNo: int
    githubIssueId: int
    title: str
    body: str = ""

    priority: Optional[str] = None
    projectId: Optional[int] = None

#이슈 단일 중요도 예측
class IssuePriorityResult(BaseModel):
    id: int
    priority: str
    rank: Optional[int] = None   
    return_score: Optional[float] = None

#이슈 목록 중요도 예측
class IssuePriorityBatchResult(BaseModel):
    results: List[IssuePriorityResult]