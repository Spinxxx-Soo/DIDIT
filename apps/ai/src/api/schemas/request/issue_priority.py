#request
from typing import Optional, List
from pydantic import BaseModel, Field

class IssueItem(BaseModel):
    id: int = Field()
    issueNo: int
    githubIssueId: int
    title: str
    body: str = ""

    priority: Optional[str] = None
    status: Optional[str] = None
    projectId: Optional[int] = None

#이슈 단일 중요도 예측
class IssuePriorityRequest(BaseModel):
    issue: IssueItem
    return_score: bool = False
#이슈 목록 중요도 예측
class IssuePriorityBatchRequest(BaseModel):
    issues: List[IssueItem]
    scores: bool = False
