import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, AlertCircle, CheckCircle2, Clock, MoreVertical, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/Button/IconButton';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { Card } from '@/components/common/Card';

import { useParams } from 'react-router-dom';
import useProjectStore from '@/store/useProjectStore';
import useAuthStore from '@/store/useAuthStore';
import useLoungeStore from '@/store/useLoungeStore';
import useChatStore from '@/store/useChatStore';
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

const RightSidebar = ({ activePanel, onClose, channelId }) => {
  const { projectId } = useParams();
  const { openIssueDetail, openCreateIssue, issues, fetchIssues, syncGithubIssues, isLoading } = useLoungeStore();
  const { user } = useAuthStore();
  const { fetchParticipants } = useProjectStore();
  const [memberMap, setMemberMap] = useState({});

  // useChatStore hooks
  const {
    messages,
    isConnected,
    connect,
    disconnect,
    sendMessage,
    editMessage,
    deleteMessage,
    fetchRecentChats,
    isLoading: isLoadingChat
  } = useChatStore();

  const isChat = activePanel === 'chat';
  const isIssueMode = activePanel === 'issue' || activePanel === 'issue_detail';
  const isDetailView = activePanel === 'issue_detail';

  // Local input state
  const [chatMessage, setChatMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showOptionId, setShowOptionId] = useState(null); // 매번 렌더링 시 menu open 여부 확인용

  const messagesEndRef = useRef(null);

  // Priority별로 정렬
  // const priorityOrder = { high: 0, medium: 1, low: 2 };

  const sortedIssues = useMemo(() => {
    // return [...(issues || [])].sort((a, b) =>
    //   (priorityOrder[a?.priority] ?? 2) - (priorityOrder[b?.priority] ?? 2)
    // );
    return issues || [];
  }, [issues]);

  // 이슈 목록 불러오기 (패널 열릴 때 한 번만)
  useEffect(() => {
    if (!isIssueMode || !projectId) return;

    // 프로젝트가 변경되면 상세 뷰를 닫고 목록으로 초기화
    if (activePanel === 'issue_detail') {
      openIssueMode(); // 목록 뷰로 리셋
    }

    // 패널 열릴 때 한 번만 fetch
    fetchIssues(projectId);
  }, [isIssueMode, projectId, fetchIssues]);

  // 채팅 및 SSE 연결 관리
  useEffect(() => {
    if (isChat && channelId) {
      console.log(`[RightSidebar] Connecting to chat room: ${channelId}`);
      fetchRecentChats(channelId, user); // 이전 대화 내용 불러오기
      connect(channelId, user); // SSE 연결
    }

    return () => {
      // 컴포넌트 언마운트 시 또는 채널 변경 시 연결 종료
      if (!isChat) {
        disconnect();
      }
    };
  }, [isChat, channelId, connect, disconnect, fetchRecentChats, user]);

  // 스크롤 자동 이동
  useEffect(() => {
    if (isChat && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChat]);

  // 참여자 정보
  useEffect(() => {
    let ignore = false;

    const loadParticipants = async () => {
      if (isChat && projectId) {
        try {
          const participants = await fetchParticipants(projectId);
          if (!ignore) {
            const mapping = {};
            participants.forEach(p => {
              mapping[p.id] = p.name;
            });
            setMemberMap(mapping);
          }
        } catch (error) {
          console.error("Failed to load participants:", error);
        }
      }
    };
    loadParticipants();

    return () => {
      ignore = true;
    };
  }, [isChat, projectId, fetchParticipants]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !channelId) return;

    try {
      await sendMessage(channelId, chatMessage, user);
      setChatMessage('');
    } catch (error) {
      console.error("Failed to send message:", error);
      // Error handled in store or UI can show toast
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!e.nativeEvent.isComposing) {
        handleSendMessage();
      }
    }
  };

  // --- Chat Edit/Delete Handlers ---
  const handleToggleOption = (id) => {
    setShowOptionId(prev => (prev === id ? null : id));
  };

  const handleInitEdit = (msg) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
    setShowOptionId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (msgId) => {
    if (!editContent.trim()) return;
    try {
      await editMessage(channelId, msgId, editContent);
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error("Edit failed", error);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (window.confirm("메시지를 삭제하시겠습니까?")) {
      try {
        await deleteMessage(channelId, msgId);
      } catch (error) {
        console.error("Delete failed", error);
      }
    }
  };

  return (
    <aside className="w-[360px] h-full bg-[var(--bg-panel)] flex flex-col overflow-hidden relative border-l border-[var(--border-default)] shadow-xl">

      {/* 1. 채팅 모드 */}
      {isChat && (
        <div className="flex flex-col h-full w-full absolute inset-0 bg-[#F8F9FA] z-10">

          {/* Header (Master Style) */}
          <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shadow-sm shrink-0">
            <div>
              <h2 className="font-bold text-lg text-gray-800">실시간 채팅</h2>
              <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                온라인
              </p>
            </div>
            <IconButton variant="ghost" size="sm" icon={<X size={20} />} onClick={onClose} />
          </div>

          {/* Message List (Master Style) */}
          <div className="flex-1 p-4 overflow-y-auto space-y-6 bg-[#F8F9FA]">
            {isLoadingChat ? (
              <div className="flex justify-center p-4 text-gray-500">로딩 중...</div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center p-4 text-gray-400 text-sm">대화 내용이 없습니다.</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.isMine ? 'flex-row-reverse' : 'flex-row'} group`}>
                  {!msg.isMine && (
                    <Avatar
                      name={memberMap[msg.sender] || `User(${msg.sender})`}
                      size="sm"
                      className="mt-1"
                    />
                  )}
                  <div className={`flex flex-col ${msg.isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    {!msg.isMine && (
                      <span className="text-[11px] text-gray-500 mb-1 ml-1">{memberMap[msg.sender] || msg.sender}</span>
                    )}

                    <div className="flex items-end gap-2">
                      {/* 내가 보낸 메시지이고, hover시 메뉴 버튼 표시 (수정 중이 아닐 때만) */}
                      {msg.isMine && !msg.isTemp && editingId !== msg.id && (
                        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleOption(msg.id)}
                            className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {/* Dropdown Menu */}
                          {showOptionId === msg.id && (
                            <div className="absolute top-6 right-0 bg-white border border-gray-100 shadow-lg rounded-lg py-1 w-24 z-20 overflow-hidden flex flex-col">
                              <button
                                onClick={() => handleInitEdit(msg)}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 w-full text-left"
                              >
                                <Edit2 size={12} /> 수정
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left"
                              >
                                <Trash2 size={12} /> 삭제
                              </button>
                            </div>
                          )}
                          {/* Click outside closer could be added here or via global listener, but for simplicity relying on toggle */}
                          {showOptionId === msg.id && (
                            <div className="fixed inset-0 z-10" onClick={() => setShowOptionId(null)} />
                          )}
                        </div>
                      )}

                      {/* Message Content or Edit Input */}
                      {editingId === msg.id ? (
                        <div className="flex flex-col items-end gap-1">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="p-2 text-sm border border-green-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 w-full min-w-[200px] resize-none"
                            rows={2}
                          />
                          <div className="flex gap-1">
                            <button onClick={handleCancelEdit} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">취소</button>
                            <button onClick={() => handleSaveEdit(msg.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">저장</button>
                          </div>
                        </div>
                      ) : (
                        <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm relative group/bubble ${msg.isMine
                          ? 'bg-green-600 text-white rounded-tr-none'
                          : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                          }`}>
                          {msg.content}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area (Master Style) */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요..."
                className="flex-1 bg-transparent border-none outline-none text-sm py-1"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                className={`
                   p-1.5 rounded-full transition-all duration-200 
                   ${chatMessage.trim() ? 'bg-green-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                 `}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 2. 이슈 모드 */}
      {isIssueMode && (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#F8F9FA] z-10">
          {/* [LAYER 1] 이슈 목록 화면 */}
          <div
            className={`
              absolute inset-0 w-full h-full flex flex-col bg-[#F8F9FA] transition-transform duration-300 ease-in-out
              ${isDetailView ? '-translate-x-[20%]' : 'translate-x-0'} 
            `}
            style={{ pointerEvents: isDetailView ? 'none' : 'auto' }}
          >
            <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-100 shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-gray-800">이슈 트래커</h2>
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
                  onClick={() => syncGithubIssues(projectId)}
                  title="새로고침"
                  disabled={isLoading}
                />
              </div>
              <IconButton variant="ghost" size="sm" icon={<X size={18} />} onClick={onClose} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F9FA]">
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
                          variant={(PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.medium).variant}
                          size="sm"
                          leftIcon={(PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.medium).icon}
                        >
                          {(PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.medium).label}
                        </Badge>
                        <Badge
                          variant={(STATUS_CONFIG[issue.status] || STATUS_CONFIG.open).variant}
                          size="sm"
                        >
                          {(STATUS_CONFIG[issue.status] || STATUS_CONFIG.open).label}
                        </Badge>
                      </div>
                      <span className="text-xs text-[var(--text-tertiary)] font-mono">
                        #{issue.issueNo || issue.id}
                      </span>
                    </div>

                    {/* 제목 */}
                    <h3 className="font-semibold text-sm text-[var(--text-bright)] mb-3 line-clamp-2">
                      {issue.title}
                    </h3>

                    {/* 담당자 */}
                    <div className="flex items-center gap-2">
                      {(issue.assignees || []).length > 0 ? (
                        <>
                          <div className="flex -space-x-2">
                            {(issue.assignees || []).slice(0, 3).map((name, idx) => (
                              <Avatar key={idx} name={name} size="xs" className="ring-2 ring-white" />
                            ))}
                          </div>
                          <span className="text-xs text-[var(--text-secondary)]">
                            {(issue.assignees || []).slice(0, 2).join(', ')}
                            {(issue.assignees || []).length > 2 && ` +${(issue.assignees || []).length - 2}`}
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