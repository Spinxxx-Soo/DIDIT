import React from 'react';
import { Link } from 'react-router-dom';

const GNB = ({ 
  variant = 'landing',
  onChatClick, 
  onIssueClick,
  activePanel 
}) => {
  const isWorkspace = variant === 'workspace';

  return (
    <header className="h-16 border-b border-gray-200 px-6 flex items-center justify-between bg-white z-[var(--z-sticky)] flex-shrink-0">
      {/* 로고 영역 */}
      <Link to="/" className="text-2xl font-bold flex items-center gap-2">
        <span className="text-3xl">PJT</span> {/* 로고 이미지 대체 */}
      </Link>

      {/* 네비게이션 영역 */}
      <nav className="flex items-center gap-4 text-[15px]">
        {isWorkspace ? (
          // [워크스페이스 모드] 채팅, 이슈 버튼
          <>
            <button 
              onClick={onChatClick}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition font-medium ${
                activePanel === 'chat' 
                  ? 'bg-gray-100 text-[var(--color-green-primary)]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>💬</span> 
              <span>채팅</span>
            </button>
            <button 
              onClick={onIssueClick}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition font-medium ${
                activePanel === 'issue' 
                  ? 'bg-gray-100 text-[var(--color-green-primary)]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>📋</span> 
              <span>이슈</span>
            </button>
          </>
        ) : (
          // [기본 모드] 기존 랜딩 페이지 메뉴
          <>
            <Link to="/about" className="hover:text-[var(--color-green-primary)]">About us</Link>
            <Link to="/contact" className="hover:text-[var(--color-green-primary)]">Contact</Link>
            <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition">
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default GNB;