# tests/check_results.py
"""Redis에 저장된 결과를 확인하는 스크립트"""
import redis
import json
import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "src"))

from common.settings import settings


def check_all_results():
    """모든 결과 키 확인"""
    r = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
        db=settings.REDIS_DB,
        decode_responses=False
    )
    
    print("=" * 60)
    print("📋 Redis 결과 확인")
    print("=" * 60)
    
    # 모든 결과 키 찾기 (통일된 키 형식 사용)
    keys = []
    # 단일 이슈 결과 확인
    if r.exists(settings.REDIS_RESULT_TOPIC_SINGLE):
        keys.append(settings.REDIS_RESULT_TOPIC_SINGLE.encode('utf-8') if isinstance(settings.REDIS_RESULT_TOPIC_SINGLE, str) else settings.REDIS_RESULT_TOPIC_SINGLE)
    # 배치 이슈 결과 확인
    if r.exists(settings.REDIS_RESULT_TOPIC_BATCH):
        keys.append(settings.REDIS_RESULT_TOPIC_BATCH.encode('utf-8') if isinstance(settings.REDIS_RESULT_TOPIC_BATCH, str) else settings.REDIS_RESULT_TOPIC_BATCH)
    
    if not keys:
        print("ℹ️  결과가 없습니다.")
        return
    
    print(f"\n✅ 발견된 결과: {len(keys)}개\n")
    
    for key in keys:
        key_str = key.decode('utf-8') if isinstance(key, bytes) else key
        result = r.get(key)
        
        if result:
            try:
                data = json.loads(result)
                print(f"🔑 키: {key_str}")
                
                if 'priority' in data:
                    # 라벨링 결과
                    print(f"   Issue ID: {data.get('issue_id')}")
                    print(f"   제목: {data.get('subject')}")
                    print(f"   우선순위: {data.get('priority')}")
                elif 'issues' in data:
                    # 재정렬 결과
                    issues = data.get('issues', [])
                    print(f"   재정렬된 이슈: {len(issues)}개")
                    for idx, issue in enumerate(issues[:5], 1):  # 최대 5개만 표시
                        print(f"   {idx}. [{issue.get('priority')}] {issue.get('subject')}")
                    if len(issues) > 5:
                        print(f"   ... 외 {len(issues) - 5}개")
                
                print()
            except json.JSONDecodeError:
                print(f"   ❌ JSON 파싱 실패")
                print()


def check_specific_result(result_key: str):
    """특정 결과 키 확인"""
    r = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
        db=settings.REDIS_DB,
        decode_responses=False
    )
    
    result = r.get(result_key)
    
    if result:
        try:
            data = json.loads(result)
            print(f"✅ 결과 발견: {result_key}\n")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        except json.JSONDecodeError:
            print(f"❌ JSON 파싱 실패")
    else:
        print(f"❌ 결과를 찾을 수 없습니다: {result_key}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # 특정 키 확인
        result_key = sys.argv[1]
        check_specific_result(result_key)
    else:
        # 모든 결과 확인
        check_all_results()
