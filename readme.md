\# Repository Structure



\## Tree



```

.

├── .gitlab/

│   └── ci/

├── apps/

│   ├── client/

│   ├── server/

│   └── ai/

├── infra/

│   └── docker-compose/

└── shared/

&nbsp;   └── api-spec/

```



\## Directory Guide



\### `.gitlab/`



\* GitLab 관련 설정을 두는 공간입니다.



\#### `.gitlab/ci/`



\* GitLab CI 파이프라인 파일을 \*\*기능/서비스 단위로 분리\*\*해서 보관하는 위치입니다.

&nbsp; (예: client/server/ai 별 CI 설정 파일)



---



\### `apps/`



\* 실제 애플리케이션 코드가 들어가는 루트입니다.



\#### `apps/client/`



\* 프론트엔드 애플리케이션 코드 위치입니다.



\#### `apps/server/`



\* 백엔드 API 서버 애플리케이션 코드 위치입니다.



\#### `apps/ai/`



\* AI 서비스/워커 애플리케이션 코드 위치입니다.



---



\### `infra/`



\* 인프라/운영 관련 파일을 모아두는 공간입니다.



\#### `infra/docker-compose/`



\* 로컬 개발 또는 서버 배포에 사용할 `docker-compose` 관련 파일 위치입니다.



---



\### `shared/`



\* 여러 앱이 함께 참조하는 \*\*공유 리소스\*\*를 두는 공간입니다.



\#### `shared/api-spec/`



\* API 명세(OpenAPI 등) 같은 \*\*공유 스펙\*\*을 보관하는 위치입니다.



---



