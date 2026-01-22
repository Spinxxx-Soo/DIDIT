import { X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/Button/IconButton';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';

const RightSidebar = ({ activePanel, onClose }) => {
  const isChat = activePanel === 'chat';
  const title = isChat ? '채팅' : '이슈 트래커';

  // 임시 이슈 데이터
  const issues = [
    { id: 23, title: '로그인 페이지 CSS 깨짐 현상', priority: 'error', assignee: '하지연' },
    { id: 22, title: 'API 응답 속도 개선 필요', priority: 'warning', assignee: '김도연' },
  ];

  // 임시 채팅 데이터
  const messages = [
    { id: 1, sender: '김도연', content: '레이아웃 작업 완료했습니다! 확인 부탁드려요.', time: '오후 2:30', isMine: false },
    { id: 2, sender: '나', content: '네, 지금 확인 중입니다. 이슈 탭 애니메이션도 추가할게요.', time: '오후 2:32', isMine: true },
  ];

  return (
    <aside className="w-[360px] flex flex-col h-full bg-[var(--bg-panel)]">
      {/* 헤더 영역 */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-[var(--border-default)] flex-shrink-0">
        <h2 className="font-bold text-lg text-[var(--text-bright)] flex items-center gap-2">
          {isChat ? '💬' : '📋'} {title}
        </h2>
        <IconButton
          variant="ghost"
          size="sm"
          icon={<X size={18} />}
          onClick={onClose}
          title="닫기"
        />
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg-app)]">
        {isChat ? (
          <div className="space-y-4">
            <div className="text-center text-[12px] text-[var(--text-tertiary)] my-4">오늘</div>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.isMine ? 'flex-row-reverse' : ''}`}>
                <Avatar name={msg.sender} size="sm" />
                <div className={msg.isMine ? 'text-right' : ''}>
                  {!msg.isMine && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-[14px] text-[var(--text-bright)]">{msg.sender}</span>
                      <span className="text-[11px] text-[var(--text-tertiary)]">{msg.time}</span>
                    </div>
                  )}
                  <div className={`p-3 rounded-[var(--radius-lg)] text-[14px] ${
                    msg.isMine
                      ? 'bg-[var(--color-green-primary)] text-white rounded-tr-none text-left'
                      : 'bg-[var(--bg-panel)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-tl-none shadow-[var(--shadow-sm)]'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="bg-[var(--bg-panel)] p-4 rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-[var(--border-default)] hover:border-[var(--color-green-primary)] transition-colors duration-200 cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={issue.priority} size="sm">
                    {issue.priority === 'error' ? 'High' : 'Medium'}
                  </Badge>
                  <span className="text-[12px] text-[var(--text-tertiary)] group-hover:text-[var(--color-green-primary)] transition-colors">
                    #{issue.id}
                  </span>
                </div>
                <h3 className="font-medium text-[var(--text-bright)] text-[14px] mb-2">{issue.title}</h3>
                <div className="flex items-center gap-2">
                  <Avatar name={issue.assignee} size="xs" />
                  <span className="text-[13px] text-[var(--text-secondary)]">{issue.assignee}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 입력/버튼 영역 */}
      <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-panel)] flex-shrink-0">
        {isChat ? (
          <div className="flex gap-2">
            <Input placeholder="메시지 입력..." size="md" className="flex-1" />
            <Button variant="primary" size="md">
              ➤
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="md" className="w-full">
            + 새 이슈 생성하기
          </Button>
        )}
      </div>
    </aside>
  );
};

export default RightSidebar;
