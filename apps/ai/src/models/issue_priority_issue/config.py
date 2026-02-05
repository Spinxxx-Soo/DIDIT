# apps/ai/src/models/issue_priority_issue/config.py
import torch
import os
import zipfile
from transformers import BitsAndBytesConfig
from pathlib import Path
from models.common.drive_io import (
    download_file_from_public_link,
    download_folder_as_zip,
    extract_file_id_from_url
)
from models.common.logger import get_logger

logger = get_logger(__name__)

# 프로젝트 루트 기준으로 절대 경로 설정
# config.py 위치: apps/ai/src/models/issue_priority_issue/config.py
# 프로젝트 루트: apps/ai (상위 3단계)
# 현재 config.py 파일의 위치를 기준으로 절대 경로를 잡음
CONFIG_DIR = Path(__file__).parent.resolve() 

# 가중치 폴더가 config.py와 같은 위치에 있다면:
ADAPTER_DIR = CONFIG_DIR / "final_lora_weights"

# Google Drive 설정 (환경변수에서 가져오기)
DRIVE_WEIGHTS_URL = os.getenv("DRIVE_WEIGHTS_URL", "")  # Google Drive 공개 링크
DRIVE_WEIGHTS_FILE_URLS = os.getenv("DRIVE_WEIGHTS_FILE_URLS", "")  # 여러 파일 링크 (쉼표로 구분)

# Google Drive에서 가중치 다운로드 시도
if DRIVE_WEIGHTS_URL and not ADAPTER_DIR.exists():
    logger.info("로컬 가중치가 없어 Google Drive에서 다운로드 시도...")
    
    file_id = extract_file_id_from_url(DRIVE_WEIGHTS_URL)
    if file_id:
        # 임시 ZIP 파일 경로
        temp_zip = CONFIG_DIR / "weights_temp.zip"
        
        # 폴더를 ZIP으로 다운로드 시도
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
                # ZIP 다운로드가 실패하면 개별 파일 다운로드 시도
                if DRIVE_WEIGHTS_FILE_URLS:
                    logger.info("개별 파일 다운로드 시도...")
                    file_urls = [url.strip() for url in DRIVE_WEIGHTS_FILE_URLS.split(",")]
                    from models.common.drive_io import download_json_files_from_drive
                    download_json_files_from_drive(file_urls, str(ADAPTER_DIR))
        else:
            # ZIP 다운로드 실패 시 개별 파일 다운로드 시도
            if DRIVE_WEIGHTS_FILE_URLS:
                logger.info("개별 파일 다운로드 시도...")
                file_urls = [url.strip() for url in DRIVE_WEIGHTS_FILE_URLS.split(",")]
                from models.common.drive_io import download_json_files_from_drive
                download_json_files_from_drive(file_urls, str(ADAPTER_DIR))

# 여러 파일 링크가 제공된 경우
elif DRIVE_WEIGHTS_FILE_URLS and not ADAPTER_DIR.exists():
    logger.info("Google Drive에서 개별 파일 다운로드 시도...")
    file_urls = [url.strip() for url in DRIVE_WEIGHTS_FILE_URLS.split(",")]
    from models.common.drive_io import download_json_files_from_drive
    download_json_files_from_drive(file_urls, str(ADAPTER_DIR))

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
USE_LORA = False  # True → False로 변경