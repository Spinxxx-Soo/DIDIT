import json
import redis
from common.settings import settings

def send_test_issue():
    # 1. Redis 연결
    try:
        r = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            db=0,
            decode_responses=True
        )
        r.ping()
        print("✅ Redis 연결 성공!")
    except Exception as e:
        print(f"❌ Redis 연결 실패: {e}")
        return

    # 2. 가짜 일감(테스트 데이터) 만들기
    # Java 백엔드에서 보낼 데이터 형식을 그대로 흉내냅니다.
    test_task = {
        "issueId": 9999,
        "userId": 1,
        "title": "crud 구현했습니다.",
        "body": "확인 부탁드립니다."
    }

    # 3. 큐에 밀어넣기 (LPUSH)
    queue_name = settings.REDIS_QUEUE_ISSUE_SINGLE # queue:issue:priority:single
    r.rpush(queue_name, json.dumps(test_task, ensure_ascii=False))
    
    print(f"🚀 테스트 데이터를 '{queue_name}' 큐에 넣었습니다.")
    print(f"내용: {test_task['title']}")
    print("\n이제 'worker' 터미널을 확인하세요!")

if __name__ == "__main__":
    send_test_issue()