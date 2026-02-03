# tests/test_redis_queue.py
"""Redis 큐를 통한 AI 서버 테스트 스크립트"""
import redis
import json
import time
import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "src"))

from common.settings import settings


class RedisQueueTester:
    """Redis 큐를 통한 AI 서버 테스트 클래스"""
    
    def __init__(self):
        """Redis 연결 초기화"""
        try:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                db=settings.REDIS_DB,
                decode_responses=False  # JSON 문자열로 저장하기 위해
            )
            # 연결 테스트
            self.redis_client.ping()
            print(f"✅ Redis 연결 성공: {settings.REDIS_HOST}:{settings.REDIS_PORT}\n")
        except Exception as e:
            print(f"❌ Redis 연결 실패: {e}")
            sys.exit(1)
    
    def test_single_issue_labeling(self, issue_id: int = 999, subject: str = None, body: str = None):
        """단일 이슈 라벨링 테스트
        
        Args:
            issue_id: 테스트용 이슈 ID
            subject: 이슈 제목 (None이면 기본값 사용)
            body: 이슈 본문 (None이면 기본값 사용)
        """
        print("=" * 60)
        print("1️⃣ 단일 이슈 라벨링 테스트")
        print("=" * 60)
        
        if subject is None:
            subject = "심각한 보안 취약점 발견"
        if body is None:
            body = "사용자 인증 시스템에 보안 취약점이 발견되었습니다. 즉시 수정이 필요합니다."
        
        task = {
            "issue_id": issue_id,
            "subject": subject,
            "body": body
        }
        
        try:
            # 큐에 작업 추가
            self.redis_client.rpush(
                settings.REDIS_QUEUE_ISSUE_SINGLE,
                json.dumps(task, ensure_ascii=False)
            )
            print(f"✅ 작업 추가 완료: issue_id={issue_id}")
            print(f"   제목: {subject}")
            print(f"   본문: {body[:50]}...")
            
            # 결과 대기
            print("\n⏳ 워커가 작업을 처리하는 중... (최대 10초 대기)")
            result_key = settings.REDIS_RESULT_TOPIC_SINGLE
            
            for i in range(10):
                time.sleep(1)
                result = self.redis_client.get(result_key)
                if result:
                    data = json.loads(result)
                    print(f"\n✅ 라벨링 결과:")
                    print(f"   Issue ID: {data.get('issue_id')}")
                    print(f"   우선순위: {data.get('priority')}")
                    return True
                print(f"   ... ({i+1}/10초)")
            
            print("\n❌ 결과를 찾을 수 없습니다. 워커가 실행 중인지 확인하세요.")
            return False
            
        except Exception as e:
            print(f"\n❌ 오류 발생: {e}")
            return False
    
    def test_batch_reorder(self, task_id: str = "test-001", return_scores: bool = True):
        """이슈 목록 재정렬 테스트
        
        Args:
            task_id: 테스트용 작업 ID
            return_scores: 점수 포함 여부
        """
        print("\n" + "=" * 60)
        print("2️⃣ 이슈 목록 재정렬 테스트")
        print("=" * 60)
        
        task = {
            "task_id": task_id,
            "issues": [
                {
                    "id": 1,
                    "subject": "크리티컬 버그 수정",
                    "body": "시스템이 다운되는 심각한 버그입니다. 즉시 수정이 필요합니다.",
                    "priority": "HIGH"
                },
                {
                    "id": 2,
                    "subject": "UI 개선 제안",
                    "body": "버튼 색상을 조금 더 밝게 변경하면 좋을 것 같습니다.",
                    "priority": "LOW"
                },
                {
                    "id": 3,
                    "subject": "성능 최적화",
                    "body": "데이터베이스 쿼리를 최적화하여 응답 속도를 개선합니다.",
                    "priority": "MEDIUM"
                },
                {
                    "id": 4,
                    "subject": "로그인 에러",
                    "body": "사용자가 로그인할 수 없습니다. 인증 토큰이 만료되는 문제가 있습니다.",
                    "priority": "HIGH"
                },
                {
                    "id": 5,
                    "subject": "문서 업데이트",
                    "body": "API 문서를 최신 버전으로 업데이트합니다.",
                    "priority": "LOW"
                }
            ],
            "return_scores": return_scores
        }
        
        try:
            # 큐에 작업 추가
            self.redis_client.rpush(
                settings.REDIS_QUEUE_ISSUE_BATCH,
                json.dumps(task, ensure_ascii=False)
            )
            print(f"✅ 작업 추가 완료: task_id={task_id}")
            print(f"   이슈 개수: {len(task['issues'])}개")
            print(f"   점수 포함: {return_scores}")
            
            # 결과 대기
            print("\n⏳ 워커가 작업을 처리하는 중... (최대 15초 대기)")
            result_key = settings.REDIS_RESULT_TOPIC_BATCH
            
            for i in range(15):
                time.sleep(1)
                result = self.redis_client.get(result_key)
                if result:
                    data = json.loads(result)
                    issues = data.get('result', [])
                    print(f"\n✅ 재정렬 결과: {len(issues)}개 이슈")
                    print("\n📊 재정렬된 순서:")
                    for idx, issue in enumerate(issues, 1):
                        priority = issue.get('priority', 'N/A')
                        score = issue.get('score', 'N/A')
                        subject = issue.get('subject', 'N/A')
                        print(f"   {idx}. [{priority}] {subject}")
                        if return_scores and score != 'N/A':
                            print(f"      점수: {score:.4f}")
                    return True
                print(f"   ... ({i+1}/15초)")
            
            print("\n❌ 결과를 찾을 수 없습니다. 워커가 실행 중인지 확인하세요.")
            return False
            
        except Exception as e:
            print(f"\n❌ 오류 발생: {e}")
            return False
    
    def check_redis_connection(self):
        """Redis 연결 상태 확인"""
        print("=" * 60)
        print("🔍 Redis 연결 상태 확인")
        print("=" * 60)
        
        try:
            info = self.redis_client.info()
            print(f"✅ Redis 연결 성공")
            print(f"   호스트: {settings.REDIS_HOST}")
            print(f"   포트: {settings.REDIS_PORT}")
            print(f"   DB: {settings.REDIS_DB}")
            print(f"   Redis 버전: {info.get('redis_version', 'N/A')}")
            
            # 큐 길이 확인
            single_queue_len = self.redis_client.llen(settings.REDIS_QUEUE_ISSUE_SINGLE)
            batch_queue_len = self.redis_client.llen(settings.REDIS_QUEUE_ISSUE_BATCH)
            
            print(f"\n📋 큐 상태:")
            print(f"   {settings.REDIS_QUEUE_ISSUE_SINGLE}: {single_queue_len}개 작업 대기 중")
            print(f"   {settings.REDIS_QUEUE_ISSUE_BATCH}: {batch_queue_len}개 작업 대기 중")
            
            return True
        except Exception as e:
            print(f"❌ Redis 연결 실패: {e}")
            return False
    
    def cleanup_test_data(self):
        """테스트 데이터 정리"""
        print("\n" + "=" * 60)
        print("🧹 테스트 데이터 정리")
        print("=" * 60)
        
        try:
            # 테스트 결과 키 삭제
            keys_to_delete = [
                settings.REDIS_RESULT_TOPIC_SINGLE,
                settings.REDIS_RESULT_TOPIC_BATCH
            ]
            
            deleted_count = 0
            for key in keys_to_delete:
                if self.redis_client.exists(key):
                    self.redis_client.delete(key)
                    deleted_count += 1
                    print(f"✅ 삭제됨: {key}")
            
            if deleted_count == 0:
                print("ℹ️  삭제할 테스트 데이터가 없습니다.")
            
        except Exception as e:
            print(f"❌ 정리 중 오류 발생: {e}")


def main():
    """메인 테스트 함수"""
    print("\n" + "=" * 60)
    print("🧪 AI 서버 Redis 큐 테스트")
    print("=" * 60)
    print("\n⚠️  주의: 워커가 실행 중이어야 합니다!")
    print("   실행 방법: python -m workers.issue_priority_worker\n")
    
    tester = RedisQueueTester()
    
    # Redis 연결 확인
    if not tester.check_redis_connection():
        print("\n❌ Redis 연결 실패. Redis가 실행 중인지 확인하세요.")
        return
    
    # 사용자 선택
    print("\n" + "=" * 60)
    print("테스트 선택")
    print("=" * 60)
    print("1. 단일 이슈 라벨링 테스트")
    print("2. 이슈 목록 재정렬 테스트")
    print("3. 전체 테스트 실행")
    print("4. 테스트 데이터 정리")
    print("0. 종료")
    
    choice = input("\n선택하세요 (0-4): ").strip()
    
    if choice == "1":
        tester.test_single_issue_labeling()
    elif choice == "2":
        tester.test_batch_reorder()
    elif choice == "3":
        print("\n🚀 전체 테스트 실행 중...\n")
        tester.test_single_issue_labeling()
        time.sleep(2)
        tester.test_batch_reorder()
    elif choice == "4":
        tester.cleanup_test_data()
    elif choice == "0":
        print("\n👋 테스트 종료")
        return
    else:
        print("\n❌ 잘못된 선택입니다.")
        return
    
    print("\n" + "=" * 60)
    print("✅ 테스트 완료")
    print("=" * 60)


if __name__ == "__main__":
    main()
