// src/layouts/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import GNB from '../components/features/layout/GNB';
import ProjectSidebar from '../components/features/layout/ProjectSidebar';

/**
 * MainLayout - GNB + ProjectSidebar
 * 사용: 마이페이지 (프로젝트 리스트)
 */
const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
      {/* 상단 네비게이션 */}
      <GNB variant="landing" />
      
      <div className="flex flex-1">
        {/* 프로젝트 사이드바 */}
        <aside className="w-[72px] bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex-shrink-0 py-4">
          <ProjectSidebar />
        </aside>
        
        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1200px] mx-auto px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;