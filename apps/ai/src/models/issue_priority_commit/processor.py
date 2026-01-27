# models/issue_priority_commit/processor.py
from typing import Optional
import yaml


class PriorityProcessor:
    """우선순위 후처리 프로세서"""
    
    def __init__(self, model_name: str = "spinxxxx/git-issues-priority-ko", 
                 use_rules: bool = True):
        """
        Args:
            model_name: 허깅페이스 모델 이름
            use_rules: 후처리 규칙 사용 여부
        """
        self.model_name = model_name
        self.use_rules = use_rules
        
        # 후처리 규칙 로드 (옵션)
        if use_rules:
            self.rules = self._load_rules()
        else:
            self.rules = None
    
    def _load_rules(self) -> Optional[dict]:
        """후처리 규칙 로드 (옵션)"""
        try:
            from huggingface_hub import hf_hub_download
            rules_path = hf_hub_download(
                repo_id=self.model_name,
                filename="postprocess/priority_rules.yaml"
            )
            with open(rules_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Warning: 후처리 규칙 로드 실패 ({e}), 규칙 없이 사용")
            return None
    
    def to_priority(self, score: float, text: str = "", thresholds: dict = None) -> str:
        """
        점수를 HIGH/MED/LOW로 변환
        
        Args:
            score: 우선순위 점수
            text: 이슈 텍스트 (후처리 규칙 사용 시 필요)
            thresholds: threshold 딕셔너리
        
        Returns:
            "HIGH", "MED", 또는 "LOW"
        """
        if thresholds is None:
            thresholds = {
                "q_low": 0.794,
                "q_high": 0.817
            }
        
        # 후처리 규칙 적용 (옵션)
        if self.use_rules and self.rules and text:
            text_lower = text.lower()
            
            # LOW 강제 키워드
            low_keywords = self.rules.get("low_forced_keywords", [])
            if any(kw in text_lower for kw in low_keywords):
                return "LOW"
            
            # HIGH 부스트 키워드
            high_keywords = self.rules.get("high_boost_keywords", [])
            if any(kw in text_lower for kw in high_keywords):
                return "HIGH"
            
            # 최소 MED 보장 키워드
            min_med_keywords = self.rules.get("min_med_keywords", [])
            if any(kw in text_lower for kw in min_med_keywords):
                if score <= thresholds["q_low"]:
                    return "MED"
        
        # 기본 변환 (threshold 기반)
        if score >= thresholds["q_high"]:
            return "HIGH"
        elif score <= thresholds["q_low"]:
            return "LOW"
        else:
            return "MED"
