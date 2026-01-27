# AI 서비스

## 우선순위 예측 서비스
## requirements 아직 작성중

이슈/커밋의 우선순위를 자동으로 예측하는 서비스입니다.

### 설치

```bash
pip install -r src/requirements.txt
```

### 사용 방법

#### 1. Python 코드에서 직접 사용

```python
from service.priority_predictor import PriorityPredictorService

# 서비스 초기화 (허깅페이스에서 자동 다운로드)
predictor = PriorityPredictorService(
    model_name="spinxxxx/git-issues-priority-ko",
    use_rules=True  # 후처리 규칙 사용
)

# 단일 예측
result = predictor.predict(
    subject="로그인 안됨",
    body="사용자가 로그인 시 401 에러 발생",
    return_score=True
)
print(f"Priority: {result['priority']}, Score: {result['score']:.4f}")

# 배치 예측
issues = [
    {"subject": "로그인 안됨", "body": "401 에러 발생"},
    {"subject": "README 오타 수정", "body": ""},
    {"subject": "서버 다운 문제", "body": "프로덕션 서버 다운"}
]

results = predictor.predict_batch(issues, return_scores=True)
for result in results:
    print(f"Rank {result['rank']}: {result['priority']} - {result['subject']}")
```

#### 2. FastAPI 서버 실행

```bash
uvicorn src.api.main:app --reload
```

서버 실행 후:
- 단일 예측: `POST /predict`
- 배치 예측: `POST /predict/batch`
- 헬스 체크: `GET /health`

### 파일 구조

```
src/
├── models/
│   └── issue_priority_commit/
│       ├── model.py            # 모델 클래스 (모델 로드, 점수 예측)
│       └── processor.py        # 후처리 프로세서 (점수 → 우선순위 변환)
├── service/
│   └── priority_predictor.py   # 우선순위 예측 서비스 클래스
├── api/
│   └── main.py                 # FastAPI 엔드포인트
└── requirements.txt            # 패키지 의존성
```

### 주요 기능

- 단일 이슈 우선순위 예측 (HIGH/MED/LOW)
- 배치 이슈 우선순위 예측 및 정렬
- 후처리 규칙 기반 키워드 필터링
- GPU 자동 감지 및 사용
