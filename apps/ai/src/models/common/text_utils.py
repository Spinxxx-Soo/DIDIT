# models/common/text_utils.py
"""텍스트 처리 공통 유틸리티"""
from typing import Optional


def build_issue_text(
    subject: str, 
    body: str = "", 
) -> str:
    """
    이슈 제목과 본문을 결합하여 텍스트를 생성합니다.
    (전처리 - 공백 제거)
    """
    if not body or not body.strip():
        return subject.strip()
    return f"{subject.strip()}\n{body.strip()}"
