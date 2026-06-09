<div align="center">

<!-- logo -->
<img src="./assets/didit-readme.png" width="320"/>

### Didit - AI 기반 팀 협업 플랫폼

[<img src="https://img.shields.io/badge/-readme.md-important?style=flat&logo=google-chrome&logoColor=white" />](./readme.md)
[<img src="https://img.shields.io/badge/-project-blue?style=flat&logo=google-chrome&logoColor=white" />](https://api.did-it.xyz)
[<img src="https://img.shields.io/badge/release-v0.1.0-yellow?style=flat&logo=google-chrome&logoColor=white" />]()
<br/>
[<img src="https://img.shields.io/badge/프로젝트 기간-2026.01~2026.02-green?style=flat&logo=&logoColor=white" />]()

</div>

## 📝 전체 서비스 설명

**Didit**은 실시간 화상 회의부터 AI 회의록 자동 생성까지, 팀 협업에 필요한 기능을 한곳에 모은 **AI 기반 팀 협업 플랫폼**입니다.

- **GitHub OAuth** 로그인 및 프로젝트·채널 관리
- **OpenVidu** 기반 실시간 화상 회의 (화면 공유, 채팅)
- **GitHub 이슈 연동** + AI 우선순위 분석·재정렬
- **AI 회의록 자동 생성** (Whisper STT → Gemini 요약)

<br />

## 🏗️ 프로젝트 아키텍처

![프로젝트 아키텍처](./assets/didit-architecture.png)

```mermaid
flowchart LR
    Client[apps/client React] -->|REST/SSE| Server[apps/server Spring Boot]
    Server -->|Redis Queue| AI[apps/ai Python Workers]
    AI -->|Pub/Sub / Key| Server
    Server -->|SSE| Client
```


<br />

## 🤖 AI 기능 상세

AI 레이어는 **Redis 큐 기반 비동기 워커** 패턴으로 동작합니다. Spring Boot가 작업을 큐에 push하면 Python 워커가 추론 후 Pub/Sub 또는 Redis Key로 결과를 반환하고, 서버는 SSE로 클라이언트에 실시간 알림을 전달합니다.

- **비동기 처리**: Redis Queue 폴링 워커 (`issue_priority_worker`, `meeting_summary_worker`)
- **이슈 우선순위**: Llama-3 4bit Few-shot 라벨링 + HF 한국어 분류 모델 재정렬
- **회의 요약**: ffmpeg 오디오 변환 → Whisper STT → Gemini 2.5 Flash JSON 요약

### AI 아키텍처

![AI 아키텍처](./assets/didit-ai-architecture.png)

<br />

### 서비스 소개

<div align="center">

https://github.com/Spinxxx-Soo/DIDIT/raw/docs/readme/assets/didit-demo.mp4

Didit 주요 기능 데모 — 로그인 · 라운지 · AI 이슈 분석 · 화상 회의 · 회의록 요약

</div>

<br />

## ⚙ 기술 스택

### Frontend
<div>
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/Zustand-443C55?style=for-the-badge" />
<img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
<img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" />
</div>

### Backend
<div>
<img src="https://img.shields.io/badge/Java_21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" />
<img src="https://img.shields.io/badge/Spring_Boot_4-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
<img src="https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white" />
<img src="https://img.shields.io/badge/Spring_Data_JPA-6DB33F?style=for-the-badge&logo=spring&logoColor=white" />
<img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
<img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
<img src="https://img.shields.io/badge/OpenVidu-83BA00?style=for-the-badge" />
</div>

### AI
<div>
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
<img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" />
<img src="https://img.shields.io/badge/Transformers-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" />
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
<img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
<img src="https://img.shields.io/badge/OpenAI_Whisper-412991?style=for-the-badge&logo=openai&logoColor=white" />
<img src="https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" />
</div>

### Infra
<div>
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
<img src="https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
<img src="https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white" />
<img src="https://img.shields.io/badge/GitLab_CI-FC6D26?style=for-the-badge&logo=gitlab&logoColor=white" />
<img src="https://img.shields.io/badge/GHCR-181717?style=for-the-badge&logo=github&logoColor=white" />
</div>

### Tools
<div>
<img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" />
<img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white" />
<img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" />
</div>

<br />

## 👤 맡은 역할

저는 이 프로젝트에서 **AI 파트**를 맡아 아래를 구현했습니다.

- Redis 큐 기반 **비동기 AI 워커** 아키텍처 설계·구현
- **Llama-3 4bit** Few-shot 이슈 우선순위 라벨링 (VRAM 6GB 최적화)
- **HF 한국어 분류 모델** + 규칙 기반 하이브리드 이슈 재정렬
- **Whisper STT → Gemini** 회의 요약 파이프라인 (ffmpeg 오디오 전처리 포함)
- Spring Boot ↔ AI 간 Redis Queue / Pub/Sub 연동 스키마 정의

<br />

## 🤔 기술적 이슈와 해결 과정

- **VRAM 6GB 제약**
    - Llama-3 8B 로드 시 OOM 발생 → 4bit 양자화(`BitsAndBytesConfig`)와 `device_map` / `max_memory` 튜닝으로 6GB GPU에서 추론 가능하도록 최적화
- **이슈 재정렬 정확도**
    - 단순 ML 점수만으로는 도메인 키워드(버그, 개선 등) 반영이 부족 → 모델 점수 + 키워드 부스트/패널티 규칙 하이브리드 적용
- **비동기 AI 처리와 실시간 UI**
    - LLM 추론 지연으로 동기 API 응답 불가 → Redis Queue 폴링 워커 + Pub/Sub으로 분석 완료 시 SSE 브로드캐스트 연동

<br />