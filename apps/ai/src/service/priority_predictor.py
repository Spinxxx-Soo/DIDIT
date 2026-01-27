# service/priority_predictor.py
from typing import List, Dict
from models.issue_priority_commit import IssuePriorityModel, PriorityProcessor


class PriorityPredictorService:
    """우선순위 예측 서비스 클래스"""
    
    def __init__(self, model_name: str = "spinxxxx/git-issues-priority-ko",
                 use_rules: bool = True):
        """
        Args:
            model_name: 허깅페이스 모델 이름
            use_rules: 후처리 규칙 사용 여부
        """
        self.model_name = model_name
        self.use_rules = use_rules
        
        # 모델 및 프로세서 초기화
        self.model = IssuePriorityModel(model_name=model_name)
        self.processor = PriorityProcessor(model_name=model_name, use_rules=use_rules)
        self.thresholds = self.model.get_thresholds()
    
    def predict_score(self, text: str) -> float:
        """
        텍스트에서 우선순위 점수 예측
        
        Args:
            text: 이슈/커밋 텍스트 (제목 + 본문)
        
        Returns:
            우선순위 점수 (원래 스케일)
        """
        return self.model.predict_score(text)
    
    def to_priority(self, score: float, text: str = "") -> str:
        """
        점수를 HIGH/MED/LOW로 변환
        
        Args:
            score: 우선순위 점수
            text: 이슈 텍스트 (후처리 규칙 사용 시 필요)
        
        Returns:
            "HIGH", "MED", 또는 "LOW"
        """
        return self.processor.to_priority(score, text, self.thresholds)
    
    def predict(self, subject: str, body: str = "", return_score: bool = False) -> Dict:
        """
        전체 예측 파이프라인
        
        Args:
            subject: 이슈/커밋 제목
            body: 이슈/커밋 본문 (선택)
            return_score: 점수도 반환할지 여부
        
        Returns:
            {"priority": str, "score": float (선택)}
        """
        # 텍스트 생성
        text = subject
        if body:
            text = f"{subject}\n{body}"
        
        # 점수 예측
        score = self.predict_score(text)
        
        # 클래스 변환
        priority = self.to_priority(score, text)
        
        result = {"priority": priority}
        if return_score:
            result["score"] = score
        
        return result
    
    def predict_batch(self, issues: List[Dict], return_scores: bool = False) -> List[Dict]:
        """
        배치 예측
        
        Args:
            issues: [{"subject": str, "body": str}, ...]
            return_scores: 점수도 반환할지 여부
        
        Returns:
            정렬된 결과 리스트 (우선순위 높은 순)
        """
        # 텍스트 생성 및 점수 예측
        texts = []
        scores = []
        
        for issue in issues:
            subject = issue.get("subject", "")
            body = issue.get("body", "")
            text = f"{subject}\n{body}" if body else subject
            texts.append(text)
            
            score = self.predict_score(text)
            scores.append(score)
        
        # 결과 생성
        results = []
        for i, issue in enumerate(issues):
            priority = self.to_priority(scores[i], texts[i])
            result = {
                "subject": issue.get("subject", ""),
                "body": issue.get("body", ""),
                "priority": priority,
                "rank": 0  # 나중에 정렬 후 할당
            }
            if return_scores:
                result["score"] = scores[i]
            results.append(result)
        
        # 우선순위 기준 정렬 (HIGH > MED > LOW, 같은 우선순위 내에서는 점수 높은 순)
        priority_order = {"HIGH": 3, "MED": 2, "LOW": 1}
        results.sort(
            key=lambda x: (priority_order.get(x["priority"], 0),
                           x.get("score", 0) if return_scores else 0),
            reverse=True
        )
        
        # 순위 할당
        for rank, result in enumerate(results, 1):
            result["rank"] = rank
        
        return results
