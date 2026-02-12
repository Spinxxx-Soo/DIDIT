# models/rag/chunking.py

from typing import List, Dict

class TextChunker:
    """텍스트를 적절한 크기의 청크로 분할하는 클래스"""
    
    def __init__(self, chunk_size=500, chunk_overlap=100, min_chunk_size=50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        
    def split_text(self, text: str) -> List[Dict[str, str]]:
        """텍스트를 청크로 분할합니다. (현재는 단순 분할 스켈레톤)"""
        # TODO: 팀원(모델 담당)이 실제 청킹 로직 구현 예정
        if not text:
            return []
            
        chunks = []
        # 단순 텍스트 분할 예시
        for i in range(0, len(text), self.chunk_size - self.chunk_overlap):
            chunk_text = text[i:i + self.chunk_size]
            if len(chunk_text) >= self.min_chunk_size:
                chunks.append({"text": chunk_text})
        return chunks
