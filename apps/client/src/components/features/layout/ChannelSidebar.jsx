import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ChannelSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname.includes(path);

  const getMenuItemClass = (active) => {
    return active
      ? "flex items-center gap-3 px-3 py-2 bg-blue-900/50 text-blue-400 rounded cursor-pointer font-medium transition-colors"
      : "flex items-center gap-3 px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded cursor-pointer transition-colors";
  };

  // 임시 멤버 데이터
  const members = [
    { id: 1, name: '김도연', isOnline: true, avatarColor: 'bg-green-200' },
    { id: 2, name: '김이', isOnline: true, avatarColor: 'bg-blue-200' },
    { id: 3, name: '이다연', isOnline: true, avatarColor: 'bg-purple-200' },
    { id: 4, name: '손을준', isOnline: false, avatarColor: 'bg-yellow-200' },
    { id: 5, name: '하지연', isOnline: false, avatarColor: 'bg-red-200' },
    { id: 6, name: '홍수민', isOnline: false, avatarColor: 'bg-indigo-200' },
    // 스크롤 테스트를 위한 더미 데이터 (필요시 주석 해제하여 테스트)
    // ...Array.from({ length: 10 }).map((_, i) => ({ id: 10 + i, name: `테스트 멤버 ${i}`, isOnline: false, avatarColor: 'bg-gray-200' }))
  ];

  return (
    <div className="flex flex-col h-full pt-4"> {/* px-4 제거하고 내부 섹션에 패딩 적용 (스크롤바 위치 때문) */}
      
      {/* 1. 상단 고정 영역 (헤더 + 워크스페이스 + 채널) */}
      <div className="flex-shrink-0 px-4 mb-2">
        {/* 헤더 */}
        <div className="h-12 flex items-center font-bold text-xl border-b border-gray-700 mb-6 text-white">
          공통 PJT
        </div>

        {/* WORKSPACE 메뉴 */}
        <div className="mb-8">
          <div className="text-xs text-gray-500 font-semibold mb-3 tracking-wider">WORKSPACE</div>
          <ul className="space-y-1">
            <li 
              onClick={() => navigate('/workspace')} 
              className={getMenuItemClass(location.pathname === '/workspace' || location.pathname === '/workspace/')}
            >
              <span>🏠</span> <span>홈</span>
            </li>
            <li 
              onClick={() => navigate('/workspace/meeting')} 
              className={getMenuItemClass(isActive('meeting'))}
            >
              <span>🎙</span> <span>회의</span>
            </li>
            <li 
              onClick={() => navigate('/workspace/minutes')} 
              className={getMenuItemClass(isActive('minutes'))}
            >
              <span>📋</span> <span>회의록</span>
            </li>
          </ul>
        </div>

        {/* CHANNELS 메뉴 */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-3 tracking-wider group">
              <span>CHANNELS</span>
              <button className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">+</button>
          </div>
          <ul className="space-y-1">
            <li className="px-3 py-1 text-gray-400 hover:bg-gray-800 rounded cursor-pointer text-sm"># 일반</li>
            <li className="px-3 py-1 text-gray-400 hover:bg-gray-800 rounded cursor-pointer text-sm"># 버그토론</li>
            <li className="px-3 py-1 text-gray-400 hover:bg-gray-800 rounded cursor-pointer text-sm"># 개발 회의</li>
            <li className="px-3 py-1 text-gray-400 hover:bg-gray-800 rounded cursor-pointer text-sm"># 긴급 회의</li>
          </ul>
        </div>
      </div>

      {/* 구분선 (선택사항) */}
      <div className="h-[1px] bg-gray-800 mx-4 mb-4 flex-shrink-0"></div>

      {/* 2. 하단 스크롤 영역 (MEMBERS 리스트만 스크롤) */}
      {/* flex-1: 남은 공간 모두 차지 / overflow-y-auto: 내용 넘치면 스크롤 / min-h-0: flex 자식 스크롤 버그 방지 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 min-h-0">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-3 tracking-wider group sticky top-0 bg-black/95 py-1 z-10 backdrop-blur-sm">
              <span>팀원 ({members.length})</span>
              <button className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">+</button>
          </div>
          <ul className="space-y-2">
              {members.map((member) => (
                  <li key={member.id} className="flex items-center gap-3 px-2 py-1 hover:bg-gray-800 rounded cursor-pointer group">
                      <div className="relative">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-gray-700 font-bold ${member.avatarColor}`}>
                              {member.name[0]}
                          </div>
                          {member.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full"></div>
                          )}
                      </div>
                      <span className={`text-sm ${member.isOnline ? 'text-gray-200' : 'text-gray-500'}`}>
                          {member.name}
                      </span>
                  </li>
              ))}
          </ul>
      </div>

      {/* 3. 하단 컨트롤 바 (고정) */}
      <div className="flex-shrink-0 py-5 border-t border-gray-700 flex justify-between px-4 bg-black mt-auto">
         <button className="text-gray-400 hover:text-green-500 transition p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
         </button>
         <button className="text-gray-400 hover:text-green-500 transition p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
         </button>
         <button className="text-gray-400 hover:text-gray-100 transition p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.332.183-.582.496-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.583-.496.645-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
         </button>
      </div>
    </div>
  );
};

export default ChannelSidebar;