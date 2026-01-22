import { Link } from 'react-router-dom';
import logo from '@/assets/didit_logo.png';
import { MessageCircle, ClipboardList } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import { Button } from '@/components/common/Button';

const GNB = ({
  variant = 'landing',
  onChatClick,
  onIssueClick,
  activePanel
}) => {
  const isWorkspace = variant === 'workspace';
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <header className="h-16 border-b border-[var(--border-default)] px-6 flex items-center justify-between bg-[var(--bg-panel)] flex-shrink-0">
      {/* 로고 영역 */}
      <Link to="/" className="flex items-center gap-2">
        <img
          src={logo}
          alt="PJT 로고"
          className="h-8 w-auto"
        />
      </Link>

      {/* 네비게이션 영역 */}
      <nav className="flex items-center gap-3 text-[15px]">
        {isWorkspace ? (
          // [워크스페이스 모드] 채팅, 이슈 버튼
          <>
            <Button
              variant={activePanel === 'chat' ? 'secondary' : 'ghost'}
              size="sm"
              leftIcon={<MessageCircle size={16} />}
              onClick={onChatClick}
              className={activePanel === 'chat' ? 'border-[var(--color-green-primary)] text-[var(--color-green-primary)]' : ''}
            >
              채팅
            </Button>
            <Button
              variant={activePanel === 'issue' ? 'secondary' : 'ghost'}
              size="sm"
              leftIcon={<ClipboardList size={16} />}
              onClick={onIssueClick}
              className={activePanel === 'issue' ? 'border-[var(--color-green-primary)] text-[var(--color-green-primary)]' : ''}
            >
              이슈
            </Button>
          </>
        ) : (
          // [기본 모드] 기존 랜딩 페이지 메뉴
          <>
            <Link
              to="/about"
              className="text-[var(--text-secondary)] hover:text-[var(--color-green-primary)] transition-colors duration-200"
            >
              About us
            </Link>
            <Link
              to="/contact"
              className="text-[var(--text-secondary)] hover:text-[var(--color-green-primary)] transition-colors duration-200"
            >
              Contact
            </Link>
            {isAuthenticated ? (
              <Button variant="secondary" size="sm" onClick={logout}>
                Logout
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm">
                  Login
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
