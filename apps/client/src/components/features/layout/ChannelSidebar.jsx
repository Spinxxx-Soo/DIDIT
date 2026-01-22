import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Mic, FileText, Hash, Plus, Mic2, Volume2, Settings } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Divider } from '@/components/common/Divider';
import { IconButton } from '@/components/common/Button/IconButton';

const ChannelSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname.includes(path);

  // 디자인 가이드 nav-item 패턴 적용
  const getMenuItemClass = (active) => {
    const baseClass = "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] cursor-pointer font-medium transition-all duration-150 text-[14px]";

    if (active) {
      return `${baseClass} bg-[var(--success-bg)] text-[var(--color-green-primary)]`;
    }
    return `${baseClass} text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-bright)]`;
  };

  // 임시 멤버 데이터
  const members = [
    { id: 1, name: '김도연', isOnline: true },
    { id: 2, name: '김이', isOnline: true },
    { id: 3, name: '이다연', isOnline: true },
    { id: 4, name: '손을준', isOnline: false },
    { id: 5, name: '하지연', isOnline: false },
    { id: 6, name: '홍수민', isOnline: false },
  ];

  // 임시 채널 데이터
  const channels = [
    { id: 1, name: '일반' },
    { id: 2, name: '버그토론' },
    { id: 3, name: '개발 회의' },
    { id: 4, name: '긴급 회의' },
  ];

  return (
    <div className="flex flex-col h-full pt-4 bg-[var(--bg-sidebar)]">
      {/* 1. 상단 고정 영역 */}
      <div className="flex-shrink-0 px-4 mb-2">
        {/* 헤더 */}
        <div className="h-12 flex items-center font-bold text-xl border-b border-[var(--border-default)] mb-6 text-[var(--text-bright)]">
          공통 PJT
        </div>

        {/* WORKSPACE 메뉴 */}
        <div className="mb-8">
          <div className="text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 tracking-wider uppercase">
            WORKSPACE
          </div>
          <ul className="space-y-1">
            <li
              onClick={() => navigate('/workspace')}
              className={getMenuItemClass(location.pathname === '/workspace' || location.pathname === '/workspace/')}
            >
              <Home size={16} /> <span>홈</span>
            </li>
            <li
              onClick={() => navigate('/workspace/meeting')}
              className={getMenuItemClass(isActive('meeting'))}
            >
              <Mic size={16} /> <span>회의</span>
            </li>
            <li
              onClick={() => navigate('/workspace/minutes')}
              className={getMenuItemClass(isActive('minutes'))}
            >
              <FileText size={16} /> <span>회의록</span>
            </li>
          </ul>
        </div>

        {/* CHANNELS 메뉴 */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 tracking-wider uppercase group">
            <span>CHANNELS</span>
            <button className="text-[var(--text-tertiary)] hover:text-[var(--color-green-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus size={14} />
            </button>
          </div>
          <ul className="space-y-1">
            {channels.map((channel) => (
              <li
                key={channel.id}
                className="flex items-center gap-2 px-3 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-bright)] rounded-[var(--radius-md)] cursor-pointer text-[14px] transition-colors duration-150"
              >
                <Hash size={14} className="text-[var(--text-tertiary)]" />
                {channel.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 구분선 */}
      <Divider className="mx-4 mb-4" />

      {/* 2. 하단 스크롤 영역 (MEMBERS 리스트) */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
        <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 tracking-wider uppercase group sticky top-0 bg-[var(--bg-sidebar)] py-1 z-10">
          <span>팀원 ({members.length})</span>
          <button className="text-[var(--text-tertiary)] hover:text-[var(--color-green-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus size={14} />
          </button>
        </div>
        <ul className="space-y-1">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 px-2 py-1.5 hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] cursor-pointer transition-colors duration-150"
            >
              <Avatar
                name={member.name}
                size="xs"
                status={member.isOnline ? 'online' : 'offline'}
              />
              <span className={`text-[14px] ${member.isOnline ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                {member.name}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. 하단 컨트롤 바 */}
      <div className="flex-shrink-0 py-4 border-t border-[var(--border-default)] flex justify-center gap-2 px-4 bg-[var(--bg-sidebar)] mt-auto">
        <IconButton
          icon={<Mic2 size={18} />}
          variant="ghost"
          size="sm"
          title="마이크"
        />
        <IconButton
          icon={<Volume2 size={18} />}
          variant="ghost"
          size="sm"
          title="스피커"
        />
        <IconButton
          icon={<Settings size={18} />}
          variant="ghost"
          size="sm"
          title="설정"
        />
      </div>
    </div>
  );
};

export default ChannelSidebar;
