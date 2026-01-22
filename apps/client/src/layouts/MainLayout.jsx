import { useState } from 'react'; // [추가] 상태 관리를 위해 필요
import { Outlet } from 'react-router-dom';
import GNB from '../components/features/layout/GNB';
import ProjectSidebar from '../components/features/layout/ProjectSidebar';
import RightSidebar from '../components/features/layout/RightSidebar'; // [추가] 사이드바 컴포넌트

const MainLayout = () => {
  // [추가 1] 데이터와 사이드바 상태 관리 (여기가 관제탑입니다)
  const [issues, setIssues] = useState([
    { id: 23, title: '로그인 페이지 CSS 깨짐 현상', priority: 'error', assignee: '하지연', description: '내용...', status: 'Open', date: '2024-05-20' },
    { id: 22, title: 'API 응답 속도 개선 필요', priority: 'warning', assignee: '김도연', description: '내용...', status: 'In Progress', date: '2024-05-19' },
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [targetIssue, setTargetIssue] = useState(null); // 어떤 이슈를 수정할지 기억

  // [추가 2] 라운지에서 호출할 함수 (이슈 클릭하면 사이드바 열기)
  const handleOpenIssueDetail = (issue) => {
    setTargetIssue(issue);
    setIsSidebarOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
      <GNB variant="landing" />
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[72px] bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex-shrink-0 py-4">
          <ProjectSidebar />
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="max-w-[1200px] mx-auto px-8 py-8 h-full">
            {/* [추가 3] Outlet에게 '이슈 데이터'랑 '여는 함수' 전달 */}
            <Outlet context={{ issues, handleOpenIssueDetail }} />
          </div>
        </main>

        {/* [추가 4] 조건부로 사이드바 표시 */}
        {isSidebarOpen && (
          <RightSidebar 
            activePanel="issue"
            onClose={() => setIsSidebarOpen(false)}
            issues={issues}
            setIssues={setIssues}
            externalTargetIssue={targetIssue}
          />
        )}
      </div>
    </div>
  );
};

export default MainLayout;