# services/issue_priority_reorder_service.py
"""이슈 목록 우선순위 재정렬 서비스"""
from typing import List, Dict, Any, Optional
from collections import defaultdict

from common.settings import MODEL_REGISTRY
from models.issue_priority_commit import (
    IssuePriorityModel,
    PriorityLevel,
    PRIORITY_LABEL_MAP,
    PRIORITY_ORDER
)
from models.common.logger import get_logger
from common.redis_client import RedisClient
from common.settings import settings

logger = get_logger(__name__)


class IssuePriorityReorderService:
    """이슈 목록 우선순위 재정렬 서비스 클래스
    
    이미 우선순위 라벨("상", "중", "하")이 붙어있는 이슈 목록을 받아,
    각 우선순위별로 그룹화한 후 점수 기반으로 재정렬합니다.
    issue_priority_commit 모델을 사용합니다.
    """
    
    def __init__(self):
        """서비스 초기화"""
        self.model_name = MODEL_REGISTRY["issue_priority_commit"]
        
        # 모델 초기화
        logger.info("이슈 우선순위 재정렬 서비스 초기화 중...")
        self.model = IssuePriorityModel()
        self.redis_client = RedisClient()
        logger.info("이슈 우선순위 재정렬 서비스 초기화 완료")
    
    @staticmethod
    def _build_text(subject: str, body: str = "") -> str:
        """이슈 제목과 본문을 결합하여 텍스트를 생성합니다.
        
        Args:
            subject: 이슈 제목
            body: 이슈 본문
        
        Returns:
            결합된 텍스트
        """
        if body:
            return f"{subject}\n{body}"
        return subject
    
    def _normalize_priority_label(self, priority: str) -> Optional[str]:
        """우선순위 라벨을 정규화합니다.
        
        Args:
            priority: 우선순위 라벨 (한글 또는 영문)
        
        Returns:
            정규화된 우선순위 (HIGH/MED/LOW) 또는 None
        """
        # 한글 라벨 매핑
        korean_map = {
            "상": PriorityLevel.HIGH,
            "중": PriorityLevel.MED,
            "하": PriorityLevel.LOW,
            "high": PriorityLevel.HIGH,
            "medium": PriorityLevel.MED,
            "low": PriorityLevel.LOW
        }
        
        normalized = korean_map.get(priority) or PRIORITY_LABEL_MAP.get(priority.upper())
        if normalized is None:
            logger.warning("알 수 없는 우선순위 라벨: %s", priority)
        return normalized
    
    def _apply_postprocess_rules(self, score: float, subject: str, body: str = "") -> float:
        """후처리 규칙을 적용하여 점수를 조정합니다.
        
        특정 키워드가 포함된 이슈의 점수를 조정합니다.
        
        Args:
            score: 원본 점수
            subject: 이슈 제목
            body: 이슈 본문
        
        Returns:
            조정된 점수
        """
        if not settings.REORDER_USE_RULES:
            return score
        
        text = f"{subject} {body}".lower()
        adjusted_score = score
        
        # 부스트 키워드 (점수 증가)
        boost_keywords = ["버그", "오류", "에러", "장애", "크래시", "실패"]
        if any(keyword in text for keyword in boost_keywords):
            adjusted_score += settings.REORDER_BOOST_SCORE
            logger.debug(
                "부스트 키워드 발견 - 원본 점수: %.3f, 조정 후: %.3f (+%.3f)",
                score,
                adjusted_score,
                settings.REORDER_BOOST_SCORE
            )
        
        # 페널티 키워드 (점수 감소)
        penalty_keywords = ["개선", "제안", "문서", "리팩토링"]
        if any(keyword in text for keyword in penalty_keywords):
            adjusted_score += settings.REORDER_PENALTY_SCORE
            logger.debug(
                "페널티 키워드 발견 - 원본 점수: %.3f, 조정 후: %.3f (%.3f)",
                score,
                adjusted_score,
                settings.REORDER_PENALTY_SCORE
            )
        
        return adjusted_score
    
    def _calculate_score(self, subject: str, body: str = "") -> float:
        """이슈 텍스트에서 우선순위 점수를 계산합니다.
        이슈 1개 텍스트 -> 모델 점수 1개 계산 + 후처리 규칙 적용.
        
        Args:
            subject: 이슈 제목
            body: 이슈 본문
        
        Returns:
            우선순위 점수 (후처리 규칙 적용 후)
        """
        # 모델로 기본 점수 계산
        text = self._build_text(subject, body)
        base_score = self.model.predict_score(text)
        
        # 후처리 규칙 적용 여부 (키워드 기반 점수 조정)
        adjusted_score = self._apply_postprocess_rules(base_score, subject, body)
        
        return adjusted_score
    
    def _group_issues_by_priority(
        self,
        issues: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """이슈 목록을 우선순위별로 그룹화합니다.
        -> 이미 들어 있는 priority 라벨을 기준으로 이슈들 분류
        Args:
            issues: 이슈 목록 [{"id": ..., "subject": str, "body": str, "priority": str}, ...]
        
        Returns:
            우선순위별로 그룹화된 딕셔너리 {priority: [issue, ...]}
        """
        grouped = defaultdict(list)
        
        for issue in issues:
            priority_label = issue.get("priority")
            if not priority_label:
                logger.warning(
                    "우선순위 라벨이 없는 이슈 발견 (id=%s), 건너뜁니다",
                    issue.get("id") or issue.get("issue_id")
                )
                continue
            
            normalized_priority = self._normalize_priority_label(priority_label)
            if normalized_priority:
                grouped[normalized_priority].append(issue)
        
        return dict(grouped)
    
    def _sort_issues_by_score(
        self,
        issues: List[Dict[str, Any]],
        return_scores: bool = False
    ) -> List[Dict[str, Any]]:
        """이슈 목록을 점수 기준으로 내림차순 정렬합니다.
        -> 점수 내림차순 정렬
        
        Args:
            issues: 이슈 목록
            return_scores: 점수를 결과에 포함할지 여부
        
        Returns:
            점수 기준으로 정렬된 이슈 목록
        """
        scored_issues = []
        
        for issue in issues:
            subject = issue.get("subject") or issue.get("title", "")
            body = issue.get("body", "")
            score = self._calculate_score(subject, body) #내부 함수 호출해서 계산
            
            result_issue = {**issue}
            
            if return_scores:
                result_issue["score"] = score
            
            scored_issues.append((score, result_issue))
        
        # 점수 기준 내림차순 정렬
        scored_issues.sort(key=lambda x: x[0], reverse=True)
        
        return [issue for _, issue in scored_issues]
    

    def _merge_priority_groups(
        self,
        grouped_issues: Dict[str, List[Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        """우선순위별로 정렬된 그룹을 우선순위 순서대로 병합합니다.
        -> HIGH + MED + LOW 그룹 순서로 이어 붙이기 
        
        Args:
            grouped_issues: 우선순위별로 그룹화된 이슈 딕셔너리
        
        Returns:
            우선순위 순서대로 병합된 이슈 목록 (상 -> 중 -> 하)
        """
        merged = []
        
        # 우선순위 순서대로 병합 (HIGH -> MED -> LOW)
        for priority in [PriorityLevel.HIGH, PriorityLevel.MED, PriorityLevel.LOW]:
            if priority in grouped_issues:
                merged.extend(grouped_issues[priority])
        
        return merged
    
    def reorder_by_priority(
        self,
        issues: List[Dict[str, Any]],
        return_scores: bool = False
    ) -> List[Dict[str, Any]]:
        """이슈 목록을 우선순위별로 재정렬합니다.
        
        이미 우선순위 라벨("상", "중", "하")이 붙어있는 이슈 목록을 받아,
        각 우선순위별로 그룹화한 후 점수 기준으로 재정렬합니다.
        
        Args:
            issues: 이슈 목록 [{"id": ..., "subject": str, "body": str, "priority": str}, ...]
            return_scores: 점수를 결과에 포함할지 여부
        
        Returns:
            재정렬된 이슈 목록 (우선순위별 그룹 내에서 점수 높은 순)
        """
        if not issues:
            logger.warning("빈 이슈 목록이 전달되었습니다")
            return []
        
        logger.info("이슈 재정렬 시작 (총 %d개)", len(issues))
        
        # 1. 우선순위별로 그룹화
        grouped_issues = self._group_issues_by_priority(issues)
        
        if not grouped_issues:
            logger.warning("유효한 우선순위 라벨이 있는 이슈가 없습니다")
            return []
        
        # 2. 각 그룹 내에서 점수 기준으로 정렬
        sorted_groups = {}
        for priority, priority_issues in grouped_issues.items():
            logger.debug(
                "우선순위 '%s' 그룹 정렬 중 (%d개)",
                priority,
                len(priority_issues)
            )
            sorted_groups[priority] = self._sort_issues_by_score(
                priority_issues,
                return_scores
            )
        
        # 3. 우선순위 순서대로 병합
        reordered_issues = self._merge_priority_groups(sorted_groups)
        
        logger.info("이슈 재정렬 완료 (총 %d개)", len(reordered_issues))
        
        return reordered_issues
    
    def process_from_redis(self) -> Optional[Dict[str, Any]]:
        """Redis 큐에서 작업을 가져와 처리하고 결과를 반환합니다.
        
        Returns:
            처리된 결과 딕셔너리 또는 None (작업이 없는 경우)
        """
        # 큐에서 작업 가져오기
        task = self.redis_client.pop_from_queue(
            settings.REDIS_QUEUE_ISSUE_BATCH,
            timeout=1  # 1초 대기
        )
        
        if task is None:
            return None
        
        try:
            # 작업 데이터 추출
            issues = task.get("issues", [])
            return_scores = task.get("return_scores", False)
            task_id = task.get("task_id") #redis 작업 ID
            
            if not issues:
                logger.error("작업에 이슈 목록이 없습니다: %s", task)
                return None
            
            # 이슈 재정렬
            reordered_issues = self.reorder_by_priority(issues, return_scores)
            
            # 결과 구성
            result = {
                "task_id": task_id,
                "issues": reordered_issues,
            }
            
            # Redis에 결과 저장
            # result_key = 결과 저장 키 
            if task_id:
                result_key = f"{settings.REDIS_RESULT_PREFIX}issue:batch:{task_id}"
                self.redis_client.set_result(result_key, result, expire=3600)  # 1시간 만료
            
            logger.info("이슈 재정렬 작업 완료: task_id=%s, count=%d", task_id, len(reordered_issues))
            return result
            
        except Exception as e:
            logger.error("이슈 재정렬 작업 처리 중 오류 발생: %s", str(e))
            return None
    
    def close(self):
        """리소스 정리"""
        try:
            self.redis_client.close()
        except Exception as e:
            logger.error("리소스 정리 중 오류 발생: %s", str(e))
