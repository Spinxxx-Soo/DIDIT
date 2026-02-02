# models/issue_priority_commit/config.py
"""이슈 우선순위 모델 관련 공통 설정"""
# todo: 수정 - 라벨명 통일
class PriorityLevel:
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


MODEL_ID = "spinxxxx/git-issues-priority-ko"
MODEL_MAX_LENGTH: int = 256

#후처리 규칙
USE_RULES: bool = True
#배치 사이즈 규칙
MAX_BATCH_SIZE: int = 100

# 재정렬 후처리 규칙 설정
REORDER_USE_RULES: bool = True  # 재정렬 후처리 규칙 사용 여부
REORDER_BOOST_SCORE: float = 0.1  # 부스트 키워드 발견 시 추가 점수
REORDER_PENALTY_SCORE: float = -0.05  # 페널티 키워드 발견 시 감점

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

# 우선순위 정렬 순서 (높은 순서부터)
PRIORITY_ORDER = {
    PriorityLevel.HIGH: 3,
    PriorityLevel.MEDIUM: 2,
    PriorityLevel.LOW: 1
}
