# Issue Priority Commit Model

이슈/커밋의 우선순위를 예측하는 모델입니다.

## 모델 정보

- **모델 이름**: `spinxxxx/git-issues-priority-ko`
- **모델 타입**: Sequence Classification
- **입력**: 이슈/커밋 텍스트 (제목 + 본문)
- **출력**: 우선순위 점수 (0.714 ~ 0.872 범위)

## 모델 구성

### 1. IssuePriorityModel (`model.py`)

모델의 핵심 로직을 담당하는 클래스입니다.

**

#### 주요 기능

- **모델 로드**: Hugging Face Hub에서 모델과 토크나이저를 자동으로 다운로드 및 로드
- **점수 예측**: 텍스트를 입력받아 우선순위 점수를 예측
- **Threshold 관리**: 모델과 함께 제공되는 threshold 값을 로드 및 관리

#### 사용 방법

```python
from models.issue_priority_commit import IssuePriorityModel

# 모델 초기화
model = IssuePriorityModel(model_name="spinxxxx/git-issues-priority-ko")

# 점수 예측
score = model.predict_score("로그인 안됨\n사용자가 로그인 시 401 에러 발생")

# Threshold 값 조회
thresholds = model.get_thresholds()
```

#### 동작 방식

1. **초기화 시**:
   - Hugging Face Hub에서 모델과 토크나이저 다운로드
   - GPU 사용 가능 시 자동으로 GPU로 모델 이동
   - `score_thresholds.json` 파일을 로드하여 threshold 값 설정

2. **예측 시**:
   - 입력 텍스트를 토크나이징 (최대 길이 256)
   - 모델에 입력하여 원시 점수 예측 (0~1 범위)
   - 원래 스케일로 변환 (train_min ~ train_max 범위)

### 2. PriorityProcessor (`processor.py`)

모델의 예측 점수를 우선순위 클래스(HIGH/MED/LOW)로 변환하는 후처리 프로세서입니다.

#### 주요 기능

- **우선순위 변환**: 점수를 HIGH/MED/LOW로 변환
- **후처리 규칙 적용**: 키워드 기반 규칙을 적용하여 우선순위 조정

#### 사용 방법

```python
from models.issue_priority_commit import PriorityProcessor

# 프로세서 초기화
processor = PriorityProcessor(
    model_name="spinxxxx/git-issues-priority-ko",
    use_rules=True  # 후처리 규칙 사용 여부
)

# 우선순위 변환
priority = processor.to_priority(
    score=0.85,
    text="로그인 안됨\n사용자가 로그인 시 401 에러 발생",
    thresholds={"q_low": 0.794, "q_high": 0.817}
)
```

#### 동작 방식

1. **후처리 규칙 적용** (옵션):
   - **LOW 강제 키워드**: 특정 키워드가 포함되면 무조건 LOW 반환
   - **HIGH 부스트 키워드**: 특정 키워드가 포함되면 무조건 HIGH 반환
   - **최소 MED 보장 키워드**: 특정 키워드가 포함되면 최소 MED 보장

2. **Threshold 기반 변환**:
   - `score >= q_high`: HIGH
   - `score <= q_low`: LOW
   - 그 외: MED

## 서비스에서의 사용

이 모델은 `services/issue_priority_service.py`에서 사용됩니다.

### 서비스 흐름

1. **서비스 초기화**:
   ```python
   from services.issue_priority_service import IssuePriorityService
   
   service = IssuePriorityService()
   ```

2. **예측 요청 처리**:
   - 서비스가 모델과 프로세서를 초기화
   - 입력 텍스트를 모델에 전달하여 점수 예측
   - 프로세서를 통해 점수를 우선순위로 변환
   - 결과 반환

3. **API 엔드포인트**:
   - `/api/issue-priority/predict`: 단일 이슈 우선순위 예측
   - `/api/issue-priority/predict/batch`: 배치 이슈 우선순위 예측

## 모델 파일 구조

```
models/issue_priority_commit/
├── model.py          # 모델 클래스 (모델 로드, 점수 예측)
├── processor.py      # 후처리 프로세서 (점수 → 우선순위 변환)
├── __init__.py       # 패키지 초기화
└── README.md         # 이 파일
```

## 주의사항

- 모델은 Hugging Face Hub에서 자동으로 다운로드되므로 첫 실행 시 시간이 걸릴 수 있습니다.
- GPU가 사용 가능한 경우 자동으로 GPU를 사용합니다.
- Threshold 값과 후처리 규칙은 모델과 함께 제공되는 파일에서 로드됩니다.
