import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import GNB from '../components/features/layout/GNB';
import ProjectSidebar from '../components/features/layout/ProjectSidebar';
import ChannelSidebar from '../components/features/layout/ChannelSidebar';
import RightSidebar from '../components/features/layout/RightSidebar';

/**
 * WorkspaceLayout - 프로젝트 내부 전체 레이아웃
 * 사용: 홈, 회의, 회의록 등 프로젝트 내부 페이지
 *
 * 
 * 구조:
 * ┌──────────────────────────────────────────┐
 * │              GNB (전체 상단)              │
 * ├──────┬────────┬────────────────┬─────────┤
 * │ Proj │Channel │    Content     │  Right  │
 * │ Side │ Side   │                │  Side   │
 * └──────┴────────┴────────────────┴─────────┘
 */
const WorkspaceLayout = () => {
  const [activePanel, setActivePanel] = useState(null); // 'chat' | 'issue' | null

  const handleChatClick = () => {
    setActivePanel(activePanel === 'chat' ? null : 'chat');
  };

  const handleIssueClick = () => {
    setActivePanel(activePanel === 'issue' ? null : 'issue');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
      {/* 상단 GNB - 전체 레이아웃 최상단 */}
      <GNB
        variant="workspace"
        onChatClick={handleChatClick}
        onIssueClick={handleIssueClick}
        activePanel={activePanel}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 1열: 프로젝트 사이드바 */}
        <aside className="w-[72px] bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex-shrink-0 py-4">
          <ProjectSidebar />
        </aside>

        {/* 2열: 채널 사이드바 */}
        <aside className="w-[240px] bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex-shrink-0">
          <ChannelSidebar />
        </aside>

        {/* 3열: 메인 콘텐츠 */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* 4열: 오른쪽 사이드바 (채팅/이슈) - 슬라이드 애니메이션 */}
        <aside
          className={`bg-[var(--bg-panel)] border-l border-[var(--border-default)] flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
            activePanel ? 'w-[320px]' : 'w-0 border-none'
          }`}
        >
          <RightSidebar activePanel={activePanel} onClose={() => setActivePanel(null)} />
        </aside>
      </div>
    </div>
  );
};

export default WorkspaceLayout;