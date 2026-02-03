/**
 * Apple-Style Workspace Layout
 * Clean panels, subtle borders, elegant spacing
 */
import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import GNB from '../components/features/layout/GNB';
import ProjectSidebar from '../components/features/layout/ProjectSidebar';
import ChannelSidebar from '../components/features/layout/ChannelSidebar';
import RightSidebar from '../components/features/layout/RightSidebar';
import useLoungeStore from '@/store/useLoungeStore';
import useMeetingStore from '@/store/useMeetingStore';

const WorkspaceLayout = () => {
  const { projectId, channelId } = useParams();

  const { activePanel, setActivePanel, closeSidebar, resetToIssueList } = useLoungeStore();
  const { isInMeeting, currentChannelMode } = useMeetingStore();

  const handleChatClick = () => {
    setActivePanel(activePanel === 'chat' ? null : 'chat');
  };

  const handleIssueClick = () => {
    if (activePanel === 'issue') {
      closeSidebar();
    } else {
      resetToIssueList();
    }
  };

  // 채널 밖에 있을 때 또는 채팅 채널일 때 채팅창이 열려있다면 닫기
  React.useEffect(() => {
    if ((!channelId && activePanel === 'chat' && !isInMeeting) || (currentChannelMode === 'CHAT' && activePanel === 'chat')) {
      closeSidebar();
    }
  }, [channelId, activePanel, closeSidebar, isInMeeting, currentChannelMode]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[var(--bg-app)]">
      <GNB
        variant="workspace"
        projectId={projectId}
        activePanel={activePanel}
        onChatClick={handleChatClick}
        onIssueClick={handleIssueClick}
        showChat={(!!channelId || isInMeeting) && currentChannelMode !== 'CHAT'}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 1열: 프로젝트 선택 바 */}
        <aside
          className="
            w-[72px] 
            flex-shrink-0
            bg-[var(--bg-sidebar)]
            border-r 
            border-[var(--border-default)]
            overflow-visible
          "
        >
          <ProjectSidebar />
        </aside>

        {/* 2열: 채널 사이드바 */}
        <aside
          className="
            w-[260px] 
            flex-shrink-0 
            flex 
            flex-col
            bg-[var(--bg-sidebar)]
            border-r 
            border-[var(--border-default)]
          "
        >
          <ChannelSidebar key={projectId} />
        </aside>

        {/* 메인 콘텐츠 */}
        <main
          className="
            flex-1 
            overflow-y-auto 
            bg-[var(--bg-app)] 
            p-8
            scrollbar-thin
          "
        >
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>

        {/* 우측 사이드바 */}
        <aside
          className={`
            flex-shrink-0 
            bg-[var(--bg-panel)]
            border-l 
            border-[var(--border-default)]
            transition-all 
            duration-300 
            ease-out
            overflow-hidden
            ${activePanel ? 'w-[380px]' : 'w-0 border-none'}
          `}
        >
          {activePanel && (
            <RightSidebar
              activePanel={activePanel}
              onClose={closeSidebar}
              channelId={channelId}
            />
          )}
        </aside>
      </div>
    </div>
  );
};

export default WorkspaceLayout;