import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

import GNB from '../components/features/layout/GNB'; // GNB import 추가
import ProjectSidebar from '../components/features/layout/ProjectSidebar';
import ChannelSidebar from '../components/features/layout/ChannelSidebar';
import RightSidebar from '../components/features/layout/RightSidebar';

const WorkspaceLayout = () => {
  // 우측 패널 상태 관리: null | 'chat' | 'issue'
  const [activePanel, setActivePanel] = useState(null);

  // 패널 토글 함수
  const togglePanel = (panelName) => {
    setActivePanel(prev => prev === panelName ? null : panelName);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* 1열: 프로젝트 선택 바 */}
      <aside className="w-[72px] bg-gray-900 flex-shrink-0 flex flex-col items-center py-4 z-30">
        <ProjectSidebar />
      </aside>

      {/* 2열: 채널 및 메뉴 바 */}
      <aside className="w-[240px] bg-black border-l border-gray-800 flex-shrink-0 flex flex-col z-20 text-white">
        <ChannelSidebar />
      </aside>

      {/* 3열: 메인 영역 (GNB + 콘텐츠 + 우측 사이드바 컨테이너) */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 relative overflow-hidden">
        
        {/* 워크스페이스 상단 GNB */}
        <GNB 
          variant="workspace" 
          activePanel={activePanel}
          onChatClick={() => togglePanel('chat')}
          onIssueClick={() => togglePanel('issue')}
        />

        {/* 콘텐츠 + 우측 패널 래퍼 */}
        <div className="flex-1 flex relative overflow-hidden">
            {/* 메인 콘텐츠 (Outlet) */}
            <main className="flex-1 overflow-y-auto relative p-6">
                <Outlet />
            </main>

            {/* ★ 4열: 우측 사이드바 (슬라이드 애니메이션 적용) */}
            {/* absolute 대신 transform을 사용하여 자연스럽게 밀고 들어오거나, 
                overlay 방식을 원하시면 absolute right-0을 사용하면 됩니다. 
                여기서는 컨텐츠를 가리지 않고 옆에 붙는 슬라이드 방식을 적용합니다. */}
            <div 
                className={`flex-shrink-0 border-l border-gray-200 bg-white transition-all duration-300 ease-in-out z-10 ${
                    activePanel ? 'w-[360px] translate-x-0' : 'w-0 translate-x-full border-none'
                }`}
                style={{ overflow: 'hidden' }} // 닫힐 때 내부 컨텐츠 숨김
            >
                {/* 패널 내용 컴포넌트 */}
                <RightSidebar 
                    activePanel={activePanel} 
                    onClose={() => setActivePanel(null)} 
                />
            </div>
        </div>

      </div>
    </div>
  );
};

export default WorkspaceLayout;