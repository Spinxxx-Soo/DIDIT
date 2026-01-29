from __future__ import annotations

import json
from typing import Any, Dict, Optional

from huggingface_hub import hf_hub_download

def try_download_from_hf(repo_id:str, filename:str) -> Optional[str]: 
    """
        HuggingFace에서 파일 다운로드 시도. 
        성공 -> 로컬 경로 반환
        실패 -> None 반환
    """
    try: 
        return hf_hub_download(repo_id=repo_id, filename=filename)
    except Exception:
        return None

def try_load_json(path: str) -> Optional[Dict[str, Any]]:
    """
        모델의 JSON 파일 로드 시도. (경계값, 추론 파라미터, 설정값 등)
        성공 -> dict 반환
        실패 -> None 반환
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
         return None

def try_load_yaml(path: str) -> Optional[Dict[str, Any]]:
    """YAML 로드. 성공 -> dict, 실패 -> None"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def try_download_and_load_yaml(repo_id: str, filename: str) -> Optional[Dict[str, Any]]:
    """HF에서 YAML 다운로드 후 로드. 성공 -> dict, 실패 -> None"""
    path = try_download_from_hf(repo_id=repo_id, filename=filename)
    if not path:
        return None
    return try_load_yaml(path)