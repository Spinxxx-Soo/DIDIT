import React from 'react';

const RightSidebar = ({ activePanel, onClose }) => {
  // 패널 타입에 따른 제목 및 내용 설정
  const isChat = activePanel === 'chat';
  const title = isChat ? '채팅' : '이슈 트래커';

  return (
    <aside className="w-[360px] flex flex-col h-full bg-white">
      {/* 헤더 영역 */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100 flex-shrink-0">
        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            {isChat ? '💬' : '📋'} {title}
        </h2>
        <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>

      {/* 컨텐츠 영역 (스크롤 가능) */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        {isChat ? (
            /* --- 채팅 UI 예시 --- */
            <div className="space-y-4">
                <div className="text-center text-xs text-gray-400 my-4">오늘</div>
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0"></div>
                    <div>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-bold text-sm">김도연</span>
                            <span className="text-[10px] text-gray-400">오후 2:30</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-200 text-sm">
                            레이아웃 작업 완료했습니다! 확인 부탁드려요.
                        </div>
                    </div>
                </div>
                {/* 내 메시지 */}
                <div className="flex flex-row-reverse gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0"></div>
                    <div className="text-right">
                        <div className="bg-[var(--color-green-primary)] text-white p-3 rounded-lg rounded-tr-none shadow-sm text-sm text-left">
                            네, 지금 확인 중입니다. 이슈 탭 애니메이션도 추가할게요.
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            /* --- 이슈 트래커 UI 예시 --- */
            <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-[var(--color-green-primary)] transition cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded">High</span>
                        <span className="text-xs text-gray-400 group-hover:text-[var(--color-green-primary)]">#23</span>
                    </div>
                    <h3 className="font-medium text-gray-800 text-sm mb-2">로그인 페이지 CSS 깨짐 현상</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-300"></div>
                        <span className="text-xs text-gray-500">하지연</span>
                    </div>
                </div>
                {/* 추가 이슈 카드들... */}
            </div>
        )}
      </div>

      {/* 하단 입력/버튼 영역 */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        {isChat ? (
             <div className="flex gap-2">
                 <input type="text" placeholder="메시지 입력..." className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-green-primary)]" />
                 <button className="bg-[var(--color-green-primary)] text-white px-3 rounded-md hover:bg-[var(--color-green-hover)]">➤</button>
             </div>
        ) : (
            <button className="w-full bg-gray-900 text-white py-2 rounded-md text-sm font-medium hover:bg-black transition">
                + 새 이슈 생성하기
            </button>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;