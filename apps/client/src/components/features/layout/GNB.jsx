/**
 * Apple-Style Global Navigation Bar
 * Glassmorphism, clean design, subtle interactions
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/didit_logo.png';
import { MessageCircle, ClipboardList } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import useProjectStore from '@/store/useProjectStore';
import { Button } from '@/components/common/Button';
import { GithubRepoSection } from './GithubRepoSection';

/**
 * Global Navigation Bar 컴포넌트 - Apple Style
 * @param {Object} props
 * @param {'landing' | 'workspace'} props.variant - GNB 모드
 * @param {Function} props.onChatClick - 채팅 버튼 클릭 핸들러
 * @param {Function} props.onIssueClick - 이슈 버튼 클릭 핸들러
 * @param {string} props.activePanel - 현재 활성화된 패널
 * @param {boolean} props.showChat - 채팅 버튼 표시 여부
 * @param {string} props.projectId - 프로젝트 ID
 */
const GNB = ({
  variant = 'landing',
  onChatClick,
  onIssueClick,
  activePanel,
  showChat = false,
  projectId,
}) => {
  const isWorkspace = variant === 'workspace';
  const { isAuthenticated, logout } = useAuthStore();
  const {
    currentProject,
    fetchProject,
    validateGithubRepo,
    updateProjectRepo,
  } = useProjectStore();

  // projectId 변경 시 프로젝트 정보 fetch
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId, fetchProject]);

  return (
    <header
      className="
        h-16 
        px-6 
        flex 
        items-center 
        justify-between 
        flex-shrink-0
        bg-[var(--bg-glass)]
        backdrop-blur-xl
        backdrop-saturate-[180%]
        border-b 
        border-[var(--border-default)]
        sticky
        top-0
        z-40
      "
    >
      {/* 로고 + 저장소 영역 */}
      <div className="flex items-center gap-5">
        <Link
          to={isWorkspace ? "/mypage" : "/"}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <img
            src={logo}
            alt="로고"
            className="h-9 w-auto"
          />
        </Link>

        {/* workspace 모드에서 저장소 정보 표시 */}
        {isWorkspace && projectId && (
          <>
            <div className="w-px h-6 bg-[var(--border-default)]" />
            <GithubRepoSection
              repoFullName={currentProject?.repoFullName}
              projectId={projectId}
              onValidateRepo={validateGithubRepo}
              onUpdateRepo={updateProjectRepo}
            />
          </>
        )}
      </div>

      {/* 네비게이션 영역 */}
      <nav className="flex items-center gap-2">
        {isWorkspace ? (
          <>
            {showChat && (
              <Button
                variant={activePanel === 'chat' ? 'secondary' : 'ghost'}
                size="sm"
                leftIcon={<MessageCircle size={16} />}
                onClick={onChatClick}
                className={`
                  rounded-full
                  ${activePanel === 'chat'
                    ? 'border-[var(--color-green-primary)] text-[var(--color-green-primary)] bg-[var(--success-bg)]'
                    : ''
                  }
                `}
              >
                채팅
              </Button>
            )}
            <Button
              variant={activePanel === 'issue' ? 'secondary' : 'ghost'}
              size="sm"
              leftIcon={<ClipboardList size={16} />}
              onClick={onIssueClick}
              className={`
                rounded-full
                ${activePanel === 'issue'
                  ? 'border-[var(--color-green-primary)] text-[var(--color-green-primary)] bg-[var(--success-bg)]'
                  : ''
                }
              `}
            >
              이슈
            </Button>
          </>
        ) : (
          <>
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="rounded-full"
              >
                Logout
              </Button>
            ) : (
              <Link to="/login">
                <Button
                  variant="primary"
                  size="sm"
                  className="shadow-none hover:shadow-[var(--shadow-glow-strong)]"
                >
                  시작하기
                </Button>
              </Link>
            )}
          </>
        )}
      </nav>
    </header>
  );
};

export default GNB;
