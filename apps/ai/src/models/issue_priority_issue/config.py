# apps/ai/src/models/issue_priority_issue/config.py
import torch
import os
import zipfile
from transformers import BitsAndBytesConfig
from pathlib import Path
from dotenv import load_dotenv
from models.common.drive_io import (
    download_file_from_public_link,
    download_file_from_drive,
    download_folder_as_zip,
    extract_file_id_from_url
)
from models.common.logger import get_logger

logger = get_logger(__name__)

# .env 파일 로드 (프로젝트 루트에서 찾기)
# config.py 위치: apps/ai/src/models/issue_priority_issue/config.py
# 프로젝트 루트: apps/ai (상위 3단계)
CONFIG_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = CONFIG_DIR.parent.parent.parent  # apps/ai 디렉토리
ENV_FILE = PROJECT_ROOT / ".env"

# .env 파일이 있으면 로드
if ENV_FILE.exists():
    try:
        # UTF-8 인코딩으로 명시적으로 로드
        load_dotenv(ENV_FILE, encoding='utf-8')
        logger.info(f"✅ .env 파일 로드 완료: {ENV_FILE}")
    except UnicodeDecodeError as e:
        logger.warning(f"⚠️ .env 파일 인코딩 오류 (UTF-8 시도 실패): {e}")
        # 다른 인코딩 시도 (CP949, Windows 기본 인코딩)
        try:
            import codecs
            with codecs.open(ENV_FILE, 'r', encoding='cp949') as f:
                content = f.read()
            # 임시 파일로 UTF-8 변환
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False, suffix='.env') as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            load_dotenv(tmp_path, encoding='utf-8')
            import os
            os.unlink(tmp_path)  # 임시 파일 삭제
            logger.info(f"✅ .env 파일 로드 완료 (인코딩 변환 후): {ENV_FILE}")
        except Exception as e2:
            logger.error(f"❌ .env 파일 로드 실패: {e2}")
            # 현재 디렉토리에서도 시도
            load_dotenv()
else:
    logger.warning(f"⚠️ .env 파일을 찾을 수 없습니다: {ENV_FILE}")
    # 현재 디렉토리에서도 시도
    load_dotenv()

# 가중치 폴더가 config.py와 같은 위치에 있다면:
ADAPTER_DIR = CONFIG_DIR / "final_lora_weights"

# Google Drive 설정 (환경변수에서 가져오기)
DRIVE_WEIGHTS_URL = os.getenv("DRIVE_WEIGHTS_URL", "")  # Google Drive 공개 링크
DRIVE_WEIGHTS_FILE_URLS = os.getenv("DRIVE_WEIGHTS_FILE_URLS", "")  # 여러 파일 링크 (쉼표로 구분)

# 디버깅: 환경변수 확인
logger.info(f"DRIVE_WEIGHTS_URL: {'설정됨' if DRIVE_WEIGHTS_URL else '없음'}")
logger.info(f"DRIVE_WEIGHTS_FILE_URLS: {'설정됨' if DRIVE_WEIGHTS_FILE_URLS else '없음'}")
logger.info(f"ADAPTER_DIR 존재 여부: {ADAPTER_DIR.exists()}")

# Google Drive에서 가중치 다운로드 시도
if not ADAPTER_DIR.exists():
    if DRIVE_WEIGHTS_URL:
        logger.info(f"로컬 가중치가 없어 Google Drive에서 다운로드 시도...")
        logger.info(f"URL: {DRIVE_WEIGHTS_URL}")
        
        file_id = extract_file_id_from_url(DRIVE_WEIGHTS_URL)
        if file_id:
            logger.info(f"추출된 파일 ID: {file_id}")
            
            # 파일 링크인지 폴더 링크인지 확인
            # 파일 링크: /file/d/ 형식
            # 폴더 링크: /drive/folders/ 형식
            is_folder = '/drive/folders/' in DRIVE_WEIGHTS_URL or '/folders/' in DRIVE_WEIGHTS_URL
            
            if is_folder:
                # 폴더를 ZIP으로 다운로드 시도
                logger.info("폴더로 감지됨, ZIP 다운로드 시도...")
                temp_zip = CONFIG_DIR / "weights_temp.zip"
                
                if download_folder_as_zip(file_id, str(temp_zip)):
                    try:
                        # ZIP 파일 압축 해제
                        with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
                            zip_ref.extractall(str(ADAPTER_DIR))
                        logger.info(f"✅ 가중치 압축 해제 완료: {ADAPTER_DIR}")
                        # 임시 ZIP 파일 삭제
                        temp_zip.unlink()
                    except Exception as e:
                        logger.error(f"ZIP 압축 해제 실패: {e}")
                        if temp_zip.exists():
                            temp_zip.unlink()
                else:
                    logger.warning("ZIP 다운로드 실패, 개별 파일 다운로드로 전환")
                    # 개별 파일 다운로드 시도 (파일 링크로 처리)
                    local_file_path = ADAPTER_DIR / "adapter_config.json"
                    if download_file_from_drive(file_id, str(local_file_path)):
                        logger.info(f"✅ 파일 다운로드 완료: {local_file_path}")
            else:
                # 개별 파일 다운로드
                logger.info("파일로 감지됨, 직접 다운로드 시도...")
                # 파일명 추출 시도
                local_file_path = ADAPTER_DIR / "adapter_config.json"  # 기본 파일명
                if download_file_from_drive(file_id, str(local_file_path)):
                    logger.info(f"✅ 파일 다운로드 완료: {local_file_path}")
                else:
                    logger.error("파일 다운로드 실패")
        else:
            logger.error(f"URL에서 파일 ID를 추출할 수 없습니다: {DRIVE_WEIGHTS_URL}")
    
    elif DRIVE_WEIGHTS_FILE_URLS:
        logger.info("Google Drive에서 개별 파일 다운로드 시도...")
        file_urls = [url.strip() for url in DRIVE_WEIGHTS_FILE_URLS.split(",")]
        from models.common.drive_io import download_json_files_from_drive
        download_json_files_from_drive(file_urls, str(ADAPTER_DIR))
    else:
        logger.warning("Google Drive URL이 설정되지 않았습니다. 로컬 가중치를 사용합니다.")
else:
    logger.info(f"로컬 가중치 폴더가 이미 존재합니다: {ADAPTER_DIR}")

MODEL_ID = "unsloth/llama-3-8b-bnb-4bit"
# 절대 경로가 존재하면 사용, 없으면 상대 경로 fallback
ADAPTER_PATH = str(ADAPTER_DIR) if ADAPTER_DIR.exists() else "./final_lora_weights"

# VRAM 6GB 최적화 핵심 설정
MAX_MEMORY = {0: "5GiB", "cpu": "14GiB"}

BNB_CONFIG = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True, # 메모리 추가 절약
)

# 파인튜닝된 무게추 사용
USE_LORA = True