# Google Drive 가중치 다운로드 가이드

이 모듈은 Google Drive 공개 링크에서 모델 가중치 파일을 자동으로 다운로드합니다.

## 설정 방법

### 1. Google Drive에 가중치 파일 업로드

1. Google Drive에 `final_lora_weights` 폴더 또는 가중치 JSON 파일들을 업로드합니다.
2. 파일/폴더를 우클릭 → "링크 공유" → "링크가 있는 모든 사용자"로 설정합니다.
3. 공유 링크를 복사합니다.

### 2. 환경변수 설정

`.env` 파일에 다음 중 하나를 설정합니다:

#### 방법 1: 폴더 링크 (ZIP 다운로드 시도)
```bash
# Google Drive 폴더 공개 링크
DRIVE_WEIGHTS_URL=https://drive.google.com/drive/folders/YOUR_FOLDER_ID?usp=sharing
```

#### 방법 2: 개별 파일 링크 (권장)
```bash
# 여러 파일 링크를 쉼표로 구분
DRIVE_WEIGHTS_FILE_URLS=https://drive.google.com/file/d/FILE_ID_1/view?usp=sharing,https://drive.google.com/file/d/FILE_ID_2/view?usp=sharing
```

### 3. 링크 형식 예시

Google Drive 링크는 다음 형식을 지원합니다:
- `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
- `https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing`
- `https://drive.google.com/uc?id=FILE_ID`

## 동작 방식

1. 모델 초기화 시 `final_lora_weights` 폴더가 없으면 자동으로 다운로드를 시도합니다.
2. 폴더 링크의 경우 ZIP 다운로드를 시도하고, 실패하면 개별 파일 다운로드를 시도합니다.
3. 다운로드된 파일은 `apps/ai/src/models/issue_priority_issue/final_lora_weights/`에 저장됩니다.
4. 이후 실행 시에는 로컬 파일을 사용하므로 다시 다운로드하지 않습니다.

## 주의사항

- Google Drive 공개 링크는 "링크가 있는 모든 사용자"로 공유되어야 합니다.
- 큰 파일의 경우 다운로드에 시간이 걸릴 수 있습니다.
- ZIP 다운로드는 Google Drive 정책에 따라 제한될 수 있으므로, 개별 파일 링크 사용을 권장합니다.

## 수동 다운로드

자동 다운로드가 실패한 경우, 수동으로 파일을 다운로드하여 다음 경로에 저장하세요:
```
apps/ai/src/models/issue_priority_issue/final_lora_weights/
```

필요한 파일:
- `adapter_config.json`
- `adapter_model.bin` (또는 다른 가중치 파일)
- 기타 필요한 설정 파일
