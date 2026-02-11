# 4. 로컬 빌드 및 실행

## 4.1 로컬 빌드(백엔드/프론트/AI/도커)

### A. 로컬(Host) 빌드
백엔드 (Spring Boot)
1. `cd apps/server`
2. `./gradlew clean build -x test` 또는 `./gradlew clean bootJar -x test`

프론트엔드 (Vite)
1. `cd apps/client`
2. `npm ci`
3. `npm run build`

AI 서비스 (FastAPI)
- 별도 빌드 산출물 없음. 의존성 설치만 진행.
1. `cd apps/ai`
2. `python -m venv .venv`
3. `.venv/Scripts/activate` (Windows)
4. `pip install -r requirements.txt`

### B. 도커 빌드
백엔드 이미지
- `docker build -t didit-server:local apps/server`

프론트엔드 이미지
- `docker build -t didit-client:local apps/client`

AI 서비스
- 전용 Dockerfile 없음. 필요 시 별도 Dockerfile 작성 또는 로컬 실행 사용.

## 4.2 로컬 실행 절차(구성요소 기동 순서)

### A. 로컬(Host) 실행
1. 인프라 기동 (DB/Redis/OpenVidu)
   - `docker compose --env-file apps/server/.env -f apps/server/docker-compose.yml up -d`
2. 백엔드 실행
   - `cd apps/server`
   - `./gradlew bootRun`
   - 환경변수는 OS/IDE에서 주입하거나 기본값 사용
3. AI 서비스 실행
   - `cd apps/ai/src`
   - `uvicorn api.main:app --host 0.0.0.0 --port 8000`
4. 프론트엔드 실행
   - `cd apps/client`
   - `npm install`
   - `npm run dev`

### B. Docker Compose 실행(전체 스택)
1. `.env` 준비
   - `infra/docker-compose/.env`에 필요한 변수 정의
   - (예: `MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `OPENVIDU_*`, `REDIS_*`)
2. 네트워크 확인
   - `infra/docker-compose/docker-compose.yml`은 `caddy_default` 외부 네트워크를 참조
   - 로컬에서 사용할 경우 네트워크 생성 또는 compose 파일 수정 필요
3. 기동
   - `docker compose --env-file infra/docker-compose/.env -f infra/docker-compose/docker-compose.yml up -d`

참고
- `apps/server/docker-compose.yml`은 로컬 개발용으로 DB/Redis/OpenVidu만 포함
- `infra/docker-compose/docker-compose.yml`은 서버/클라이언트 이미지를 사용(빌드 없이 풀)
