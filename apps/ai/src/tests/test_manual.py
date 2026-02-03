# tests/test_manual.py
"""수동으로 Redis 큐에 작업을 추가하는 간단한 스크립트"""
import redis
import json
import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "src"))

from common.settings import settings


def add_single_issue_task():
    """단일 이슈 라벨링 작업 추가"""
    r = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
        db=settings.REDIS_DB,
        decode_responses=False
    )
    
    task = {
        "issue_id": 1,
        "subject": "로그인 버그 수정",
        "body": "사용자가 로그인할 수 없습니다. 에러 메시지가 표시됩니다."
    }
    
    r.rpush(settings.REDIS_QUEUE_ISSUE_SINGLE, json.dumps(task, ensure_ascii=False))
    print("✅ 단일 이슈 라벨링 작업 추가됨")
    print(f"   큐: {settings.REDIS_QUEUE_ISSUE_SINGLE}")
    print(f"   작업: {task}")


def add_batch_reorder_task():
    """이슈 목록 재정렬 작업 추가"""
    r = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
        db=settings.REDIS_DB,
        decode_responses=False
    )
    
    task = {
        "task_id": "test-001",
        "issues": [
            {
                "id": 1,
                "subject": "버그 수정",
                "body": "중요한 버그입니다",
                "priority": "상"
            },
            {
                "id": 2,
                "subject": "문서 작성",
                "body": "문서를 업데이트합니다",
                "priority": "하"
            },
            {
                "id": 3,
                "subject": "기능 추가",
                "body": "새로운 기능을 추가합니다",
                "priority": "중"
            }
        ],
        "return_scores": True
    }
    
    r.rpush(settings.REDIS_QUEUE_ISSUE_BATCH, json.dumps(task, ensure_ascii=False))
    print("✅ 이슈 목록 재정렬 작업 추가됨")
    print(f"   큐: {settings.REDIS_QUEUE_ISSUE_BATCH}")
    print(f"   작업: {len(task['issues'])}개 이슈")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("사용법:")
        print("  python test_manual.py single   # 단일 이슈 라벨링 작업 추가")
        print("  python test_manual.py batch    # 이슈 목록 재정렬 작업 추가")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "single":
        add_single_issue_task()
    elif command == "batch":
        add_batch_reorder_task()
    else:
        print(f"❌ 알 수 없는 명령어: {command}")
        sys.exit(1)
