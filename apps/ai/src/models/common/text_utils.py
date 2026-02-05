# models/common/text_utils.py
"""텍스트 처리 공통 유틸리티"""
from typing import Optional
import re


def is_meaningless_text(text: str) -> bool:
    """
    의미없는 텍스트인지 판단합니다.
    
    Args:
        text: 검사할 텍스트
    
    Returns:
        의미없는 텍스트면 True, 의미있는 텍스트면 False
    """
    if not text or not text.strip():
        return True
    
    text = text.strip()
    
    # 1. 너무 짧은 텍스트 (2자 이하)
    if len(text) <= 2:
        return True
    
    # 2. 반복되는 문자만 있는 경우 (예: "aaaaa", "ㅌㅌㅌㅌ", "11111")
    # 같은 문자가 전체의 80% 이상을 차지하는 경우
    if len(text) > 2:
        char_counts = {}
        for char in text:
            if char.strip():  # 공백 제외
                char_counts[char] = char_counts.get(char, 0) + 1
        
        if char_counts:
            max_count = max(char_counts.values())
            if max_count / len(text.replace(' ', '')) >= 0.8:
                return True
    
    # 3. 특수문자만 있는 경우 (한글, 영문, 숫자가 하나도 없는 경우)
    has_korean = bool(re.search(r'[가-힣]', text))
    has_english = bool(re.search(r'[a-zA-Z]', text))
    has_number = bool(re.search(r'[0-9]', text))
    
    if not (has_korean or has_english or has_number):
        return True
    
    # 4. 연속된 같은 문자 패턴 (예: "aaaa", "ㅌㅌㅌㅌ")
    # 같은 문자가 4번 이상 연속으로 나오는 경우
    if re.search(r'(.)\1{3,}', text):
        return True
    
    return False


def validate_issue_text(subject: str, body: str = "") -> tuple[bool, Optional[str]]:
    """
    이슈 텍스트가 유효한지 검증합니다.
    
    Args:
        subject: 이슈 제목
        body: 이슈 본문
    
    Returns:
        (유효 여부, 오류 메시지)
        유효하면 (True, None), 유효하지 않으면 (False, 오류 메시지)
    """
    # 제목 검증
    if not subject or not subject.strip():
        return False, "제목이 비어있습니다."
    
    if is_meaningless_text(subject):
        return False, f"제목이 의미없는 텍스트입니다: '{subject[:20]}...'"
    
    # 본문이 있는 경우 본문도 검증
    if body and body.strip():
        if is_meaningless_text(body):
            # 본문만 의미없으면 경고만 하고 제목으로 진행
            pass
    
    # 제목과 본문을 합쳐서도 검증
    combined = f"{subject.strip()}\n{body.strip()}" if body and body.strip() else subject.strip()
    if is_meaningless_text(combined):
        return False, f"전체 텍스트가 의미없는 내용입니다."
    
    return True, None


def build_issue_text(
    subject: str, 
    body: str = "", 
) -> str:
    """
    이슈 제목과 본문을 결합하여 텍스트를 생성합니다.
    (전처리 - 공백 제거)
    
    Note: 의미없는 텍스트 검증은 validate_issue_text()를 사용하세요.
    """
    if not body or not body.strip():
        return subject.strip()
    return f"{subject.strip()}\n{body.strip()}"
