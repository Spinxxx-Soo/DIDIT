# AI 서버 실행 가이드

FastAPI 기반 AI 모델 서비스 서버입니다.

## 📋 사전 요구사항

- Python 3.8 이상
- pip (Python 패키지 관리자)

## 🚀 빠른 시작

### 1. 디렉토리 이동

```powershell
cd apps\ai\src
```

### 2. 가상환경 설정 (권장)

**처음 한 번만:**
```powershell
# 가상환경 생성
python -m venv venv

# 가상환경 활성화
.\venv\Scripts\Activate.ps1
```

**이후 실행 시:**
```powershell
.\venv\Scripts\Activate.ps1
```

### 3. 의존성 설치

```powershell
pip install -r requirements.txt
```

### 4. 환경 변수 설정

`apps/ai/src/.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# AI 서버 설정
APP_NAME=AI Service API
APP_VERSION=1.0.0
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Issue 모델 설정
MODEL_ISSUE_PRIORITY_COMMIT=spinxxxx/git-issues-priority-ko
USE_RULES=true

# 배치 설정
MAX_BATCH_SIZE=100

# 로깅 설정
LOG_LEVEL=INFO

# Redis 설정 (현재 미사용 - 이후 추가)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_DB=0
# REDIS_PASSWORD=
```

### 5. 서버 실행

**방법 1: Python 모듈로 실행 (권장)**
```powershell
python -m api.main
```

**방법 2: uvicorn 직접 실행**
```powershell
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

서버가 정상 실행되면 다음 메시지가 표시됩니다:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## 🔍 서버 확인

브라우저나 curl로 Health Check 엔드포인트를 확인하세요:

```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:8000/health"

# 또는 브라우저에서
http://localhost:8000/health
```

정상 응답:
```json
{"status": "ok"}
```

## 📡 API 엔드포인트 - >>>엔드 포인트 더 늘어날 예정 참고용<<< 

### Health Check
- **GET** `/health`
- 서버 상태 확인

### Issue Priority (이슈 우선순위 예측)

#### 단일 이슈 예측
- **POST** `/api/v1/issue-priority/predict`
- **Request Body:**
  ```json
  {
    "id" : "이슈 ID? 백엔드에서 이슈 구분할 id"
    "subject": "이슈 제목",
    "body": "이슈 본문 (선택사항)"
  }
  ```
- **Response:**
  ```json
  {
    "priority": "HIGH|MED|LOW",
    "score": 0.85
  }
  ```

#### 배치 예측
- **POST** `/api/v1/issue-priority/predict/batch`
- **Request Body:**
  ```json
  {
    "issues": [
      {"id": "백엔드에서 이슈 구분할 id", "subject": "이슈 1", "body": "본문 1"},
      {"id": "백엔드에서 이슈 구분할 id", "subject": "이슈 2", "body": "본문 2"}
    ]
  }
  ```
- **Response:**
  ```json
  {
    "results": [
      {"id": "백엔드에서 이슈 구분할 id", "priority": "HIGH", "score": 0.85},
      {"id": "백엔드에서 이슈 구분할 id", "priority": "MED", "score": 0.65}
    ]
  }
  ```

### Meeting Summary (회의 요약) - 현재 미구현

- **GET** `/api/v1/meeting-summary/process?meeting_id={id}&file_key={key}`
- **POST** `/api/v1/meeting-summary/process`
- **Note:** Redis 설정이 필요하며 현재는 비활성화 상태입니다.

## ⚙️ 설정

### 환경 변수

`.env` 파일에서 다음 설정을 변경할 수 있습니다:

- `HOST`: 서버 호스트 (기본값: `0.0.0.0`)
- `PORT`: 서버 포트 (기본값: `8000`)
- `MODEL_ISSUE_PRIORITY_COMMIT`: 사용할 모델 이름
- `USE_RULES`: 후처리 규칙 사용 여부 (기본값: `true`)
- `MAX_BATCH_SIZE`: 배치 예측 최대 개수 (기본값: `100`)

### 포트 변경

`.env` 파일에서 `PORT` 값을 변경하거나, uvicorn 실행 시 포트를 지정하세요:

```powershell
uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
```

## 🐛 문제 해결

### 모듈을 찾을 수 없음 (ModuleNotFoundError)

의존성이 설치되지 않았을 수 있습니다:
```powershell
pip install -r requirements.txt
```

### 포트가 이미 사용 중

다른 포트를 사용하거나 기존 프로세스를 종료하세요:
```powershell
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :8000

# 프로세스 종료 (PID 확인 후)
taskkill /PID [PID번호] /F
```

### Redis 관련 오류

현재 Redis는 미사용 상태입니다. `meeting_summary` 관련 기능은 Redis 설정 후 사용 가능합니다.

## 📝 참고사항

- 서버는 `.env` 파일의 설정을 자동으로 읽습니다.
- `--reload` 옵션을 사용하면 코드 변경 시 자동으로 재시작됩니다 (개발용).
- 프로덕션 환경에서는 `--reload` 옵션을 제거하세요.

## 🔗 관련 파일

- `src/api/main.py`: FastAPI 애플리케이션 진입점
- `src/common/settings.py`: 설정 관리
- `src/requirements.txt`: Python 패키지 의존성
- `src/.env`: 환경 변수 설정 파일
