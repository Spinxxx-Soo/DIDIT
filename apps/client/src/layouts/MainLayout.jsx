import React from 'react';
import { Outlet } from 'react-router-dom';
// ★ features 폴더에 만든 GNB를 가져옵니다.
import GNB from '../components/features/layout/GNB';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 상단 고정 네비게이션 */}
      <GNB />
      
      {/* 페이지별 콘텐츠가 들어갈 영역 */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;