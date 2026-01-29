# models/issue_priority_commit/constants.py
"""이슈 우선순위 모델 관련 공통 상수"""


class PriorityLevel:
    """우선순위 레벨 상수"""
    HIGH = "HIGH"
    MED = "MED"
    LOW = "LOW"


# 우선순위 변환용 기본 threshold 값
PRIORITY_THRESHOLDS = {
    "q_low": 0.794,
    "q_high": 0.817
}


# 모델 스케일링용 기본 threshold 값 (train_min, train_max 포함)
MODEL_THRESHOLDS = {
    "q_low": 0.794,
    "q_high": 0.817,
    "train_min": 0.714,
    "train_max": 0.872
}


# Threshold 검증에 필요한 키
REQUIRED_THRESHOLD_KEYS = {"q_low", "q_high", "train_min", "train_max"}


# 한글 우선순위 라벨 매핑
PRIORITY_LABEL_MAP = {
    "HIGH": PriorityLevel.HIGH,
    "MEDIUM": PriorityLevel.MED,
    "LOW": PriorityLevel.LOW
}


# 우선순위 정렬 순서 (높은 순서부터)
PRIORITY_ORDER = {
    PriorityLevel.HIGH: 3,
    PriorityLevel.MED: 2,
    PriorityLevel.LOW: 1
}
