# AI 서버 테스트 가이드

이 폴더에는 AI 서버의 Redis 큐 기반 작업 처리를 테스트하는 스크립트들이 포함되어 있습니다.

## 📋 테스트 파일 설명

### 1. `test_redis_queue.py` (메인 테스트 스크립트)
- **기능**: Redis 큐를 통한 전체 테스트
- **사용법**: 
  ```bash
  python -m tests.test_redis_queue
  ```
- **테스트 항목**:
  - Redis 연결 확인
  - 단일 이슈 라벨링 테스트
  - 이슈 목록 재정렬 테스트
  - 테스트 데이터 정리

### 2. `test_manual.py` (간단한 작업 추가)
- **기능**: Redis 큐에 작업을 빠르게 추가
- **사용법**:
  ```bash
  # 단일 이슈 라벨링 작업 추가
  python -m tests.test_manual single
  
  # 이슈 목록 재정렬 작업 추가
  python -m tests.test_manual batch
  ```

### 3. `check_results.py` (결과 확인)
- **기능**: Redis에 저장된 결과 확인
- **사용법**:
  ```bash
  # 모든 결과 확인
  python -m tests.check_results
  
  # 특정 결과 확인
  python -m tests.check_results "issue:priorityissue:label:1"
  ```

## 🚀 테스트 실행 방법

### 사전 준비

1. **Redis 실행 확인**
   ```bash
   redis-cli ping
   # 응답: PONG
   ```

2. **워커 실행** (별도 터미널)
   ```bash
   cd apps/ai/src
   python -m workers.issue_priority_worker
   ```

### 테스트 실행

#### 방법 1: 대화형 테스트 (권장)
```bash
cd apps/ai/src
python -m tests.test_redis_queue
```

메뉴에서 원하는 테스트를 선택하세요:
- `1`: 단일 이슈 라벨링 테스트
- `2`: 이슈 목록 재정렬 테스트
- `3`: 전체 테스트 실행
- `4`: 테스트 데이터 정리

#### 방법 2: 직접 작업 추가
```bash
# 단일 이슈 라벨링
python -m tests.test_manual single

# 이슈 목록 재정렬
python -m tests.test_manual batch
```

#### 방법 3: Redis CLI 직접 사용
```bash
# 단일 이슈 라벨링 작업 추가
redis-cli RPUSH queue:issue:priority:single '{"issue_id": 1, "subject": "버그 수정", "body": "중요한 버그입니다"}'

# 이슈 목록 재정렬 작업 추가
redis-cli RPUSH queue:issue:priority:sort '{"task_id": "test-001", "issues": [{"id": 1, "subject": "버그", "body": "버그입니다", "priority": "상"}], "return_scores": true}'
```

## 📊 결과 확인

### 방법 1: 스크립트 사용
```bash
python -m tests.check_results
```

### 방법 2: Redis CLI 사용
```bash
# 모든 결과 키 확인
redis-cli KEYS "issue:priority*"

# 특정 결과 확인
redis-cli GET "issue:priorityissue:label:1"
redis-cli GET "issue:priority:sort_result_topic"
```

## 🔍 예상 결과

### 단일 이슈 라벨링 결과
```json
{
  "issue_id": 1,
  "subject": "버그 수정",
  "body": "중요한 버그입니다",
  "priority": "상"
}
```

### 이슈 목록 재정렬 결과
```json
{
  "issues": [
    {
      "id": 1,
      "subject": "버그 수정",
      "body": "중요한 버그입니다",
      "priority": "상",
      "score": 0.8234
    },
    ...
  ]
}
```

## ⚠️ 주의사항

1. **워커 실행 필수**: 테스트 전에 워커가 실행 중이어야 합니다.
2. **Redis 연결**: Redis가 실행 중이고 설정이 올바른지 확인하세요.
3. **환경 변수**: `.env` 파일에 Redis 설정이 있는지 확인하세요.

## 🐛 문제 해결

### 워커가 작업을 처리하지 않는 경우
- 워커 로그 확인
- Redis 연결 상태 확인
- 큐 이름이 올바른지 확인

### 결과를 찾을 수 없는 경우
- 결과 키 형식 확인
- Redis에 실제로 저장되었는지 확인
- 만료 시간 확인 (기본 1시간)

### Redis 연결 실패
- Redis 서버 실행 확인: `redis-cli ping`
- 호스트/포트 설정 확인
- 방화벽 설정 확인
