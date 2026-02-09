# 2. 소스 획득 및 프로젝트 구조

## 2.1 저장소 정보(브랜치/태그/릴리즈 기준 포함)
- 저장소 URL: https://lab.ssafy.com/s14-webmobile1-sub1/S14P11B202.git
- 기본 브랜치: `master` (origin/HEAD)
- 현재 로컬 HEAD: `1196448` (Merge branch 'change' into 'master')
- 확인된 브랜치: `master`, `feat/#74-summary`, `bug/#129-fix-redis-message-listner`, `bug/fix-hikari`, `bug/fix-paging-filtering`, `bug/fix-recording`, `bug/fix-recording-start`, `task/update-docs`
- 태그: 없음 (git tag --list 기준)
- 릴리즈 기준: Git tag 또는 GitLab Release를 기준으로 관리. 현재 로컬 저장소 기준 릴리즈 태그 없음.

## 2.2 Clone 및 초기 설정
1. `git clone https://lab.ssafy.com/s14-webmobile1-sub1/S14P11B202.git`
2. `cd S14P11B202`
3. 환경 변수 확인 및 수정: `apps/server/.env`, `apps/client/.env` (필요 시 값 변경)
4. AI 서비스 환경 변수: `apps/ai/.env` 로딩 지원 (필요 시 생성)
5. 실행 방식 선택: 로컬 개발용 `apps/server/docker-compose.yml` 또는 배포용 `infra/docker-compose/docker-compose.yml`

## 2.3 프로젝트 구조(모듈/디렉터리) 및 설정 파일 위치 규칙
- `.gitlab/ci`: GitLab CI 파이프라인 분리 구성
- `.vscode`: 개발 환경 보조 설정
- `apps/client`: 프론트엔드 애플리케이션
- `apps/server`: 백엔드 API 서버
- `apps/ai`: AI 서비스/워커
- `infra/docker-compose`: 배포/운영용 Docker Compose
- `shared/api-spec`: 공용 API 스펙
- `exec`: 실행 스크립트 또는 운영 보조 파일

설정 파일 위치 규칙
- 프론트엔드 빌드/런타임: `apps/client/package.json`, `apps/client/vite.config.js`, `apps/client/.env`
- 프론트엔드 컨테이너/웹서버: `apps/client/Dockerfile`, `apps/client/nginx.conf`
- 백엔드 빌드: `apps/server/build.gradle`, `apps/server/gradle/wrapper/gradle-wrapper.properties`
- 백엔드 런타임 설정: `apps/server/src/main/resources/application.yml`, `apps/server/src/main/resources/application-prod.yml`
- 백엔드 컨테이너: `apps/server/Dockerfile`
- 로컬 개발용 Compose: `apps/server/docker-compose.yml`
- 배포/운영용 Compose: `infra/docker-compose/docker-compose.yml`
- AI 의존성/환경: `apps/ai/requirements.txt`, `apps/ai/src/common/settings.py`
