import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import GNB from '../components/features/layout/GNB';
import ProjectSidebar from '../components/features/layout/ProjectSidebar';
import ChannelSidebar from '../components/features/layout/ChannelSidebar';
import RightSidebar from '../components/features/layout/RightSidebar';

/**
 * WorkspaceLayout - 프로젝트 내부 전체 레이아웃
 * 사용: 홈, 회의, 회의록 등 프로젝트 내부 페이지
 *
 * 구조:
 * ┌──────────────────────────────────────────┐
 * │              GNB (전체 상단)              │
 * ├──────┬────────┬────────────────┬─────────┤
 * │ Proj │Channel │    Content     │  Right  │
 * │ 72px │ 240px  │    flex-1      │  360px  │
 * └──────┴────────┴────────────────┴─────────┘
 */
const WorkspaceLayout = () => {
  const [activePanel, setActivePanel] = useState(null); // 'chat' | 'issue' | null
  const [selectedIssue, setSelectedIssue] = useState(null);

  const handleChatClick = () => {
    setActivePanel(activePanel === 'chat' ? null : 'chat');
  };

  const handleIssueClick = () => {
    setActivePanel(activePanel === 'issue' ? null : 'issue');
  };

    // ✅ Dashboard에서 호출할 함수
  const handleOpenIssueDetail = (issue) => {
    setSelectedIssue(issue);
    setActivePanel('issue');
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--bg-app)]">
      {/* 최상단 GNB - 전체 너비 */}
      <GNB
        variant="workspace"
        activePanel={activePanel}
        onChatClick={handleChatClick}
        onIssueClick={handleIssueClick}
      />

      {/* 하단 영역: 사이드바들 + 콘텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 1열: 프로젝트 선택 바 */}
        <aside className="w-[72px] bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex-shrink-0 flex flex-col items-center py-4">
          <ProjectSidebar />
        </aside>

        {/* 2열: 채널 사이드바 */}
        <aside className="w-[240px] bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex-shrink-0 flex flex-col">
          <ChannelSidebar />
        </aside>

        <main className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-6">
          <Outlet context={{ handleOpenIssueDetail }} />
        </main>

        {/* 4열: 우측 사이드바 (슬라이드 애니메이션) */}
        <aside
          className={`flex-shrink-0 border-l border-[var(--border-default)] bg-[var(--bg-panel)] transition-all duration-300 ease-in-out overflow-hidden ${
            activePanel ? 'w-[360px]' : 'w-0 border-none'
          }`}
        >
          {activePanel && (
            <RightSidebar
              activePanel={activePanel}
              selectedIssue={selectedIssue}
              onClose={() => setActivePanel(null)}
            />
          )}
        </aside>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
