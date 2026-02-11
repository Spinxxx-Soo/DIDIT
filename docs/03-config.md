**설정(환경변수/프로퍼티)**

**3.1 환경 변수/프로퍼티 목록(필수/선택, 보안등급 포함)**
보안등급 기준: 공개(Public)=무해한 공개 가능, 내부(Internal)=외부 공개 비권장, 비밀(Secret)=키/토큰/비밀번호.

환경 변수 목록
| 구성요소 | 키 | 필수 | 보안등급 | 기본값/설명 | 근거 |
| --- | --- | --- | --- | --- | --- |
| 공통 | TZ | 선택 | 공개 | 컨테이너 타임존 설정 | `apps/server/docker-compose.yml`, `infra/docker-compose/docker-compose.yml` |
| DB | MYSQL_ROOT_PASSWORD | 필수(컨테이너) | 비밀 | MySQL root 비밀번호 | `apps/server/docker-compose.yml`, `infra/docker-compose/docker-compose.yml` |
| DB | MYSQL_DATABASE | 선택 | 공개 | 기본 DB 이름, 기본값 `didit` | `apps/server/src/main/resources/application.yml`, `infra/docker-compose/docker-compose.yml` |
| DB | MYSQL_USER | 선택 | 비밀 | DB 사용자 | `apps/server/src/main/resources/application.yml`, `apps/server/.env` |
| DB | MYSQL_PASSWORD | 선택 | 비밀 | DB 비밀번호 | `apps/server/src/main/resources/application.yml`, `apps/server/.env` |
| DB | MYSQL_HOST | 선택 | 내부 | DB 호스트, 기본값 `db` 또는 `localhost` | `apps/server/src/main/resources/application.yml`, `apps/server/.env` |
| DB | MYSQL_PORT | 선택 | 내부 | DB 포트, 기본값 `3306` | `apps/server/src/main/resources/application.yml` |
| OAuth | GITHUB_CLIENT_ID | 선택(기능 의존) | 내부 | GitHub OAuth Client ID | `apps/server/src/main/resources/application.yml`, `apps/server/.env` |
| OAuth | GITHUB_CLIENT_SECRET | 선택(기능 의존) | 비밀 | GitHub OAuth Client Secret | `apps/server/src/main/resources/application.yml`, `apps/server/.env` |
| Redis | REDIS_HOST | 선택 | 내부 | Redis 호스트, 기본값 `localhost` | `apps/server/src/main/resources/application.yml` |
| Redis | REDIS_PORT | 선택 | 내부 | Redis 포트, 기본값 `6379` | `apps/server/src/main/resources/application.yml` |
| Redis | REDIS_PASSWORD | 선택 | 비밀 | Redis 비밀번호 | `apps/server/src/main/resources/application.yml`, `apps/server/.env` |
| OpenVidu | OPENVIDU_URL | 필수(기능 의존) | 내부 | OpenVidu 서버 URL | `apps/server/src/main/resources/application.yml`, `apps/server/.env` |
| OpenVidu | OPENVIDU_SECRET | 필수(기능 의존) | 비밀 | OpenVidu 비밀키 | `apps/server/src/main/resources/application.yml`, `apps/server/.env` |
| OpenVidu | OPENVIDU_WEBHOOK_TOKEN | 선택 | 비밀 | OpenVidu Webhook 토큰 | `apps/server/src/main/resources/application.yml`, `apps/server/.env` |
| OpenVidu | OPENVIDU_WEBHOOK | 선택 | 내부 | Webhook 활성화 여부 | `apps/server/.env` |
| OpenVidu | OPENVIDU_WEBHOOK_ENDPOINT | 선택 | 내부 | Webhook 수신 엔드포인트 | `apps/server/.env` |
| OpenVidu | OPENVIDU_WEBHOOK_HEADERS | 선택 | 내부 | Webhook 헤더 목록(JSON 문자열) | `apps/server/.env` |
| OpenVidu | OPENVIDU_WEBHOOK_EVENTS | 선택 | 내부 | Webhook 이벤트 목록(JSON 문자열) | `apps/server/.env` |
| Spring | SPRING_PROFILES_ACTIVE | 선택 | 공개 | 실행 프로필(`prod` 등) | `infra/docker-compose/docker-compose.yml` |
| Client | VITE_USE_MOCK | 선택 | 공개 | 목업 사용 여부 | `apps/client/.env` |
| Client | VITE_BACKEND_URL | 선택(운영 시 필수) | 내부 | 프론트에서 호출할 API URL | `apps/client/.env` |
| AI | APP_NAME | 선택 | 공개 | AI 서비스 이름 | `apps/ai/src/common/settings.py` |
| AI | APP_VERSION | 선택 | 공개 | AI 서비스 버전 | `apps/ai/src/common/settings.py` |
| AI | HOST | 선택 | 내부 | AI 서비스 바인딩 호스트 | `apps/ai/src/common/settings.py` |
| AI | PORT | 선택 | 내부 | AI 서비스 포트, 기본 `8000` | `apps/ai/src/common/settings.py` |
| AI | DEBUG | 선택 | 내부 | 디버그 모드 | `apps/ai/src/common/settings.py` |
| AI | LOG_LEVEL | 선택 | 내부 | 로깅 레벨 | `apps/ai/src/common/settings.py` |
| AI | REDIS_HOST | 선택 | 내부 | AI용 Redis 호스트 | `apps/ai/src/common/settings.py` |
| AI | REDIS_PORT | 선택 | 내부 | AI용 Redis 포트 | `apps/ai/src/common/settings.py` |
| AI | REDIS_PASSWORD | 선택 | 비밀 | AI용 Redis 비밀번호 | `apps/ai/src/common/settings.py` |
| AI | REDIS_TIMEOUT | 선택 | 내부 | Redis 타임아웃(초) | `apps/ai/src/common/settings.py` |
| AI | REDIS_QUEUE_ISSUE_SINGLE | 선택 | 내부 | 단일 이슈 분석 큐 | `apps/ai/src/common/settings.py` |
| AI | REDIS_QUEUE_ISSUE_BATCH | 선택 | 내부 | 배치 이슈 정렬 큐 | `apps/ai/src/common/settings.py` |
| AI | REDIS_QUEUE_MEETING_SUMMARY | 선택 | 내부 | 회의 요약 큐 | `apps/ai/src/common/settings.py` |
| AI | REDIS_RESULT_TOPIC_SINGLE | 선택 | 내부 | 단일 이슈 결과 토픽 | `apps/ai/src/common/settings.py` |
| AI | REDIS_RESULT_TOPIC_BATCH | 선택 | 내부 | 배치 정렬 결과 토픽 | `apps/ai/src/common/settings.py` |
| AI | REDIS_RESULT_TOPIC_MEETING_SUMMARY | 선택 | 내부 | 회의 요약 결과 토픽 | `apps/ai/src/common/settings.py` |
| AI | WHISPER_PROXY_URL | 선택 | 내부 | Whisper 프록시 URL | `apps/ai/src/common/settings.py` |
| AI | GMS_KEY | 선택(기능 의존) | 비밀 | Whisper/GMS API 키 | `apps/ai/src/common/settings.py` |
| AI | REDIS_DB | 선택(코드 참조) | 내부 | 코드에서 참조됨. settings.py에 정의 누락 | `apps/ai/src/api/main.py` |

프로퍼티 목록(Sprint Boot 주요 항목)
| 파일 | 프로퍼티 | 필수 | 보안등급 | 설명 |
| --- | --- | --- | --- | --- |
| `apps/server/src/main/resources/application.yml` | `server.forward-headers-strategy` | 선택 | 공개 | 프록시 환경 헤더 처리 방식 |
| `apps/server/src/main/resources/application.yml` | `server.servlet.session.cookie.same-site` | 선택 | 공개 | 세션 쿠키 SameSite 정책 |
| `apps/server/src/main/resources/application.yml` | `server.servlet.session.cookie.secure` | 선택 | 공개 | HTTPS 전용 쿠키 설정 |
| `apps/server/src/main/resources/application.yml` | `spring.mvc.async.request-timeout` | 선택 | 공개 | 비동기 요청 타임아웃(ms) |
| `apps/server/src/main/resources/application.yml` | `spring.datasource.url` | 필수 | 내부 | JDBC URL(환경변수 치환) |
| `apps/server/src/main/resources/application.yml` | `spring.datasource.username` | 필수 | 비밀 | DB 계정(환경변수 치환) |
| `apps/server/src/main/resources/application.yml` | `spring.datasource.password` | 필수 | 비밀 | DB 비밀번호(환경변수 치환) |
| `apps/server/src/main/resources/application.yml` | `spring.jpa.hibernate.ddl-auto` | 선택 | 공개 | 스키마 관리 전략 |
| `apps/server/src/main/resources/application.yml` | `spring.jpa.open-in-view` | 선택 | 공개 | OSIV 사용 여부 |
| `apps/server/src/main/resources/application.yml` | `spring.flyway.*` | 선택 | 공개 | Flyway 마이그레이션 설정 |
| `apps/server/src/main/resources/application.yml` | `spring.security.oauth2.client.registration.github.*` | 선택(기능 의존) | 비밀 | GitHub OAuth 설정 |
| `apps/server/src/main/resources/application.yml` | `spring.data.redis.*` | 선택 | 내부 | Redis 연결 정보 |
| `apps/server/src/main/resources/application.yml` | `openvidu.*` | 선택(기능 의존) | 비밀 | OpenVidu 연동 설정 |
| `apps/server/src/main/resources/application.yml` | `springdoc.swagger-ui.*` | 선택 | 공개 | Swagger UI 설정 |
| `apps/server/src/main/resources/application-prod.yml` | `springdoc.*` | 선택 | 공개 | 운영 환경 Swagger 비활성화 |
| `apps/server/src/main/resources/application-prod.yml` | `spring.datasource.hikari.*` | 선택 | 내부 | HikariCP 풀 설정 |
| `apps/server/src/main/resources/application-prod.yml` | `server.tomcat.threads.max` | 선택 | 공개 | 톰캣 쓰레드 최대값 |

**3.2 설정 주입 방식(.env/CI/OS 등) 및 샘플 파일 안내**
- Docker Compose
  - `apps/server/docker-compose.yml` 과 `infra/docker-compose/docker-compose.yml` 는 동일 디렉터리의 `.env` 또는 OS 환경변수를 읽음.
  - 로컬 개발 샘플: `apps/server/.env`.
  - 배포용 `infra/docker-compose/` 경로에는 `.env` 샘플이 없으므로 별도 생성 또는 CI/OS 환경변수로 주입.
- Spring Boot
  - `application.yml`과 `application-prod.yml`에 정의된 프로퍼티가 기본값.
  - `${ENV:default}` 형식으로 환경변수 치환. OS 환경변수, 컨테이너 env, CI 변수로 오버라이드 가능.
- 프론트엔드(Vite)
  - `apps/client/.env` 사용. `VITE_` prefix만 빌드 시 주입됨.
  - Docker 빌드 시에는 빌드 컨텍스트에 `.env`를 포함하거나 빌드 인자로 대체.
- AI(FastAPI)
  - `apps/ai/src/common/settings.py`가 `.env` 로딩 지원. `apps/ai/.env` 생성 후 실행 권장.
  - OS 환경변수로도 동일 키 주입 가능.

샘플 파일 위치
- 서버: `apps/server/.env`
- 클라이언트: `apps/client/.env`
- AI: 샘플 없음(필요 시 `apps/ai/.env` 생성)
