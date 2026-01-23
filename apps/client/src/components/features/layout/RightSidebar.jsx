import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Clock } from 'lucide-react'; 
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/Button/IconButton';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { Card } from '@/components/common/Card';

import useLoungeStore from '@/store/useLoungeStore';
import IssueDetailPanel from './IssueDetailPanel';

// Priority 설정
const PRIORITY_CONFIG = {
  high: { 
    label: 'High', 
    variant: 'error',
    icon: <AlertCircle size={13} />
  },
  medium: { 
    label: 'Medium', 
    variant: 'warning',
    icon: <Clock size={13} />
  },
  low: { 
    label: 'Low', 
    variant: 'info',
    icon: <CheckCircle2 size={13} />
  },
};

// Status 설정
const STATUS_CONFIG = {
  open: { label: 'Open', variant: 'warning' },
  closed: { label: 'Closed', variant: 'success' },
};

const RightSidebar = ({ activePanel, onClose }) => {
  const { openIssueDetail, openCreateIssue, issues } = useLoungeStore();
  
  const isChat = activePanel === 'chat';
  const isIssueMode = activePanel === 'issue' || activePanel === 'issue_detail';
  const isDetailView = activePanel === 'issue_detail'; 

  const [chatMessage, setChatMessage] = useState('');

  // Priority별로 정렬 (high > medium > low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedIssues = [...issues].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // 채팅 임시 데이터
  const messages = [
    { id: 1, sender: '김도연', content: '레이아웃 작업 완료했습니다!', time: '오후 2:30', isMine: false },
    { id: 2, sender: '나', content: '네, 지금 확인 중입니다.', time: '오후 2:32', isMine: true },
  ];

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    console.log('Send:', chatMessage);
    setChatMessage('');
  };

  return (
    <aside className="w-[360px] h-full bg-[var(--bg-panel)] flex flex-col overflow-hidden relative border-l border-[var(--border-default)] shadow-xl">
      
      {/* 1. 채팅 모드 */}
      {isChat && (
        <div className="flex flex-col h-full w-full absolute inset-0 bg-[var(--bg-panel)] z-10">
          <div className="h-14 flex items-center justify-between px-5 border-b border-[var(--border-default)]">
            <h2 className="font-bold text-lg text-[var(--text-bright)]">채팅</h2>
            <IconButton variant="ghost" size="sm" icon={<X size={18} />} onClick={onClose} />
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[var(--bg-app)]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.isMine ? 'flex-row-reverse' : ''}`}>
                 <div className={`p-2 rounded-lg text-sm ${msg.isMine ? 'bg-green-500 text-white' : 'bg-white border'}`}>
                    {msg.content}
                 </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t bg-[var(--bg-panel)] flex gap-2">
            <Input 
              value={chatMessage} 
              onChange={(e) => setChatMessage(e.target.value)} 
              placeholder="메시지 입력..." 
              className="flex-1"
            />
            <Button onClick={handleSendMessage}>➤</Button>
          </div>
        </div>
      )}

      {/* 2. 이슈 모드 */}
      {isIssueMode && (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-[var(--bg-panel)]">
          
          {/* [LAYER 1] 이슈 목록 화면 */}
          <div 
            className={`
              absolute inset-0 w-full h-full flex flex-col bg-[var(--bg-panel)] transition-transform duration-300 ease-in-out
              ${isDetailView ? '-translate-x-[20%]' : 'translate-x-0'} 
            `}
            style={{ pointerEvents: isDetailView ? 'none' : 'auto' }}
          >
            <div className="h-14 flex items-center justify-between px-5 border-b border-[var(--border-default)]">
              <h2 className="font-bold text-lg text-[var(--text-bright)]">이슈 트래커</h2>
              <IconButton variant="ghost" size="sm" icon={<X size={18} />} onClick={onClose} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg-app)]">
              {sortedIssues.map((issue) => (
                <Card
                  key={issue.id}
                  padding="none"
                  isClickable
                  onClick={() => openIssueDetail(issue.id)}
                  className="overflow-hidden"
                >
                  <div className="p-4">
                    {/* 상단: Priority + Status + ID */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={PRIORITY_CONFIG[issue.priority].variant}
                          size="sm"
                          leftIcon={PRIORITY_CONFIG[issue.priority].icon}
                        >
                          {PRIORITY_CONFIG[issue.priority].label}
                        </Badge>
                        <Badge 
                          variant={STATUS_CONFIG[issue.status].variant}
                          size="sm"
                        >
                          {STATUS_CONFIG[issue.status].label}
                        </Badge>
                      </div>
                      <span className="text-xs text-[var(--text-tertiary)] font-mono">
                        #{issue.id}
                      </span>
                    </div>

                    {/* 제목 */}
                    <h3 className="font-semibold text-sm text-[var(--text-bright)] mb-3 line-clamp-2">
                      {issue.title}
                    </h3>

                    {/* 담당자 */}
                    <div className="flex items-center gap-2">
                      {issue.assignees.length > 0 ? (
                        <>
                          <div className="flex -space-x-2">
                            {issue.assignees.slice(0, 3).map((name, idx) => (
                              <Avatar key={idx} name={name} size="xs" className="ring-2 ring-white" />
                            ))}
                          </div>
                          <span className="text-xs text-[var(--text-secondary)]">
                            {issue.assignees.slice(0, 2).join(', ')}
                            {issue.assignees.length > 2 && ` +${issue.assignees.length - 2}`}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-[var(--text-tertiary)] italic">
                          담당자 없음
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="p-4 border-t bg-[var(--bg-panel)]">
              <Button 
                className="w-full"
                onClick={openCreateIssue}
              >
                + 새 이슈 생성하기
              </Button>
            </div>
          </div>

          {/* [LAYER 2] 이슈 상세 화면 */}
          <div 
            className={`
              absolute inset-0 w-full h-full bg-white z-20 transition-transform duration-300 ease-in-out shadow-[-4px_0_15px_rgba(0,0,0,0.1)]
              ${isDetailView ? 'translate-x-0' : 'translate-x-full'}
            `}
          >
            {isDetailView && <IssueDetailPanel />}
          </div>

        </div>
      )}
    </aside>
  );
};

export default RightSidebar;