# apps/ai/src/models/issue_priority_issue/config.py
import torch
from transformers import BitsAndBytesConfig
from pathlib import Path

# 프로젝트 루트 기준으로 절대 경로 설정
# config.py 위치: apps/ai/src/models/issue_priority_issue/config.py
# 프로젝트 루트: apps/ai (상위 3단계)
# 현재 config.py 파일의 위치를 기준으로 절대 경로를 잡음
CONFIG_DIR = Path(__file__).parent.resolve() 

# 가중치 폴더가 config.py와 같은 위치에 있다면:
ADAPTER_DIR = CONFIG_DIR / "final_lora_weights"

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