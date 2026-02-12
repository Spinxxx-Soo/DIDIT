# models/rag/embedding_service.py

from typing import List, Optional
import numpy as np

class EmbeddingService:
    """텍스트를 벡터로 변환하는 클래스"""
    
    def __init__(self, model_name="sentence-transformers/all-MiniLM-L6-v2"):
        # TODO: 팀원(모델 담당)이 실제 모델 로딩 및 캐싱 구현 예정
        self.model_name = model_name
        
    def encode(self, texts: List[str]) -> List[List[float]]:
        """텍스트 리스트를 벡터 리스트로 변환합니다."""
        # TODO: 실제 임베딩 모델 호출로 대체 필요
        return [[0.0] * 384 for _ in texts]
        
    def encode_single(self, text: str) -> List[float]:
        """단일 텍스트를 벡터로 변환합니다."""
        return [0.0] * 384
