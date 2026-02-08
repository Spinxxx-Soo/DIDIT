/**
 * Apple-Style Main Layout
 * Clean design for MyPage / Project List
 */
import { Outlet } from 'react-router-dom';
import GNB from '../components/features/layout/GNB';
import ProjectSidebar from '../components/features/layout/ProjectSidebar';

/**
 * MainLayout - GNB + ProjectSidebar
 * 사용: 마이페이지 (프로젝트 리스트)
 */
const MainLayout = () => {
  return (
    <div className="h-screen bg-[var(--bg-app)] flex flex-col overflow-hidden">
      {/* 상단 네비게이션 */}
      <GNB variant="landing" />

      <div className="flex flex-1 overflow-hidden">
        {/* 프로젝트 사이드바 */}
        <aside
          className="
            w-[72px] 
            flex-shrink-0
            bg-[var(--bg-sidebar)] 
            border-r 
            border-[var(--border-default)]
          "
        >
          <ProjectSidebar />
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-auto scrollbar-thin">
          <div className="max-w-[1100px] mx-auto px-10 py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};


export default MainLayout;