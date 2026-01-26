import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import GNB from '../components/features/layout/GNB';
import ProjectSidebar from '../components/features/layout/ProjectSidebar';
import ChannelSidebar from '../components/features/layout/ChannelSidebar';
import RightSidebar from '../components/features/layout/RightSidebar';
import useLoungeStore from '@/store/useLoungeStore';

const WorkspaceLayout = () => {
  const { projectId, channelId } = useParams(); // URL 파라미터에서 channelId 추출

  // ★ resetToIssueList를 스토어에서 꺼내옵니다.
  const { activePanel, setActivePanel, closeSidebar, resetToIssueList } = useLoungeStore();

  const handleChatClick = () => {
    setActivePanel(activePanel === 'chat' ? null : 'chat');
  };

  const handleIssueClick = () => {
    // 1. 현재 '이슈 목록(issue)'이 이미 열려있다면 -> 닫기 (토글 기능)
    if (activePanel === 'issue') {
      closeSidebar();
    }
    // 2. 그 외의 모든 경우 (닫혀있음, 채팅 중, 이슈 상세/수정 보는 중)
    // -> 싹 초기화하고 '이슈 목록'을 보여줌
    else {
      resetToIssueList();
    }
  };

  // 채널 밖에 있을 때 채팅창이 열려있다면 닫기
  React.useEffect(() => {
    if (!channelId && activePanel === 'chat') {
      closeSidebar();
    }
  }, [channelId, activePanel, closeSidebar]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--bg-app)]">
      <GNB
        variant="workspace"
        activePanel={activePanel}
        onChatClick={handleChatClick}
        onIssueClick={handleIssueClick}
        showChat={!!channelId}
        projectId={projectId}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 1열: 프로젝트 선택 바 */}
        <aside className="w-[72px] bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex-shrink-0">
          <ProjectSidebar />
        </aside>

        <aside className="w-[240px] bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex-shrink-0 flex flex-col">
          <ChannelSidebar />
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-6">
          <Outlet />
        </main>

        {/* 우측 사이드바 */}
        <aside
          className={`flex-shrink-0 border-l border-[var(--border-default)] bg-[var(--bg-panel)] transition-all duration-300 ease-in-out overflow-hidden ${activePanel ? 'w-[360px]' : 'w-0 border-none'
            }`}
        >
          {activePanel && (
            <RightSidebar
              activePanel={activePanel}
              onClose={closeSidebar}
              channelId={channelId} // RightSidebar에 channelId 전달
            />
          )}
        </aside>
      </div>
    </div>
  );
};

export default WorkspaceLayout;