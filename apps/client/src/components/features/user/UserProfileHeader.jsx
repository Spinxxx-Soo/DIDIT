import React from 'react';

const UserProfileHeader = () => {
    // 실제 데이터는 나중에 Props나 Context로 받아옵니다.
    const userName = "이다연"; 
    
  return (
    <div className="flex items-center gap-6 mb-12">
      {/* 프로필 이미지 영역 */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden shadow-md">
            {/* 이미지 플레이스홀더 */}
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">👤</div>
        </div>
        {/* Edit 뱃지 (스타일 가이드 Badge 참조) */}
        <button className="absolute bottom-0 right-0 bg-gray-800 text-white text-[11px] px-2 py-1 rounded-md font-medium hover:bg-black transition">
            Edit
        </button>
      </div>

      {/* 환영 텍스트 */}
      <div>
        <h1 className="text-[32px] font-bold text-gray-900 leading-tight">
          오늘 하루도 힘차게 시작해보아요,<br />
          <span className="text-[var(--color-green-primary)]">{userName}님!</span>
        </h1>
      </div>
    </div>
  );
};

export default UserProfileHeader;