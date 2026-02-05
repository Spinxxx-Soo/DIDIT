/**
 * Apple-Style Workspace Layout
 * Clean panels, subtle borders, elegant spacing
 */
import React from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import GNB from '../components/features/layout/GNB';
import ProjectSidebar from '../components/features/layout/ProjectSidebar';
import ChannelSidebar from '../components/features/layout/ChannelSidebar';
import RightSidebar from '../components/features/layout/RightSidebar';
import useLoungeStore from '@/store/useLoungeStore';
import useMeetingStore from '@/store/useMeetingStore';
import useProjectStore from '@/store/useProjectStore';
import useProjectSSE from '@/hooks/useProjectSSE';

const WorkspaceLayout = () => {
  const { projectId, channelId } = useParams();
  const navigate = useNavigate();

  const { activePanel, setActivePanel, closeSidebar, resetToIssueList } = useLoungeStore();
  const { isInMeeting, currentChannelMode } = useMeetingStore();
  const { allProjects, fetchAllProjects } = useProjectStore();

  // 프로젝트 SSE 연결 (프로젝트 스트림 + chat 워크어라운드 스트림)
  useProjectSSE(projectId);

  // 프로젝트 접근 권한 체크
  React.useEffect(() => {
    const checkProjectAccess = async () => {
      // allProjects가 없으면 먼저 로드
      let projects = allProjects;
      if (!projects || projects.length === 0) {
        await fetchAllProjects();
        projects = useProjectStore.getState().allProjects;
      }

      // 현재 프로젝트가 사용자가 속한 프로젝트 목록에 있는지 확인
      const hasAccess = projects.some(p => p.id === Number(projectId));
      if (!hasAccess) {
        navigate('/mypage', { replace: true });
      }
    };

    if (projectId) {
      checkProjectAccess();
      // 프로젝트 변경 시 우측 사이드바 닫기 (이전 프로젝트의 이슈/채팅 상태 잔재 방지)
      closeSidebar();
    }
  }, [projectId, navigate, allProjects, fetchAllProjects, closeSidebar]);

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

  const isChannelView = !!channelId;

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
          className={`
            flex-1 
            bg-[var(--bg-app)] 
            ${isChannelView ? 'overflow-hidden relative' : 'overflow-y-auto p-8 scrollbar-thin'}
          `}
        >
          <div className={isChannelView ? 'w-full h-full' : 'max-w-[1400px] mx-auto'}>
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