# models/issue_priority_issue/config.py
import torch
from transformers import BitsAndBytesConfig
from pathlib import Path

# 프로젝트 루트 기준으로 절대 경로 설정
# config.py 위치: apps/ai/src/models/issue_priority_issue/config.py
# 프로젝트 루트: apps/ai (상위 3단계)
CONFIG_DIR = Path(__file__).parent
PROJECT_ROOT = CONFIG_DIR.parent.parent.parent  # src/models/issue_priority_issue -> apps/ai
ADAPTER_DIR = PROJECT_ROOT / "final_lora_weights"

MODEL_ID = "unsloth/llama-3-8b-bnb-4bit"
# 절대 경로가 존재하면 사용, 없으면 상대 경로 fallback
ADAPTER_PATH = str(ADAPTER_DIR) if ADAPTER_DIR.exists() else "./final_lora_weights"

BNB_CONFIG = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
)

#worker Test 용 임시 (수정 필요)
USE_LORA = False