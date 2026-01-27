# models/issue_priority_commit/model.py
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import json
from typing import Optional, Dict
import yaml


class IssuePriorityModel:
    """이슈 우선순위 예측 모델 클래스"""
    
    def __init__(self, model_name: str = "spinxxxx/git-issues-priority-ko"):
        """
        Args:
            model_name: 허깅페이스 모델 이름
        """
        self.model_name = model_name
        
        # 모델 로드 (허깅페이스에서 자동 다운로드)
        print(f"모델 로드 중: {model_name}")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self.model.eval()
        
        # GPU 사용 가능 시 자동 이동
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        if torch.cuda.is_available():
            self.model = self.model.to(self.device)
            print(f"GPU 사용: {self.device}")
        
        # Threshold 로드
        self.thresholds = self._load_thresholds()
    
    def _load_thresholds(self) -> dict:
        """score_thresholds.json 로드"""
        try:
            from huggingface_hub import hf_hub_download
            thresholds_path = hf_hub_download(
                repo_id=self.model_name,
                filename="score_thresholds.json"
            )
            with open(thresholds_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: threshold 로드 실패 ({e}), 기본값 사용")
            return {
                "q_low": 0.794,
                "q_high": 0.817,
                "train_min": 0.714,
                "train_max": 0.872
            }
    
    def predict_score(self, text: str) -> float:
        """
        텍스트에서 우선순위 점수 예측
        
        Args:
            text: 이슈/커밋 텍스트 (제목 + 본문)
        
        Returns:
            우선순위 점수 (원래 스케일)
        """
        # 토크나이징
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=256
        )
        
        # GPU 사용 시 입력도 GPU로 이동
        if torch.cuda.is_available():
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # 예측
        with torch.no_grad():
            outputs = self.model(**inputs)
            score_raw = outputs.logits.item()  # 0~1 범위
        
        # 원래 스케일로 복원
        train_min = self.thresholds["train_min"]
        train_max = self.thresholds["train_max"]
        score = score_raw * (train_max - train_min) + train_min
        
        return score
    
    def get_thresholds(self) -> dict:
        """Threshold 값 반환"""
        return self.thresholds
