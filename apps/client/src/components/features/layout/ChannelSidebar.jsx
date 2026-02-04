import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Home, Mic, FileText, Hash, Plus, Headphones, MicOff, HeadphoneOff, PhoneOff, Monitor, MonitorOff, Circle, ArrowLeft, Settings, Copy, UserMinus, Link, Pencil, Trash2, X, Check, Minus } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Divider } from '@/components/common/Divider';
import { IconButton } from '@/components/common/Button/IconButton';
import { ConfirmModal } from '@/components/common/Modal/ConfirmModal';
import useMeetingStore from '@/store/useMeetingStore';
import useOpenVidu from '@/hooks/useOpenVidu';
import { projectApi } from '@/api/project';
import { meetingApi } from '@/api/meeting';
import MeetingMinutesList from '@/components/features/meeting/MeetingMinutesList';
import DraggableSummaryWindow from '@/components/features/meeting/DraggableSummaryWindow';
import { ManageMembersModal } from '@/components/features/project/ManageMembersModal';
import useAuthStore from '@/store/useAuthStore';
import useProjectStore from '@/store/useProjectStore';
import useToastStore from '@/store/useToastStore';

const ChannelSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user } = useAuthStore();
  const { currentProject } = useProjectStore();
  const { addToast } = useToastStore();

  // 회의 상태 (전역 스토어)
  const {
    isInMeeting,
    isMicOn,
    isSpeakerOn,
    isScreenSharing,
    isScreenShareLoading,
    isRecording,
    currentChannelId,
    setCurrentChannel,
    participants,
  } = useMeetingStore();

  // OpenVidu 훅
  const { toggleMic, toggleSpeaker, toggleScreenShare, leaveSession } = useOpenVidu();

  // 데이터 상태
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  // UI 상태
  const [isChannelChangeModalOpen, setIsChannelChangeModalOpen] = useState(false);
  const [pendingChannel, setPendingChannel] = useState(null);
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('channels'); // 'channels' | 'minutes'
  const [selectedSummary, setSelectedSummary] = useState(null);

  // 채널 관리 모드 상태
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [channelMode, setChannelMode] = useState(null); // 'create' | 'edit' | 'delete' | null

  // 생성 모드 상태
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('VOICE');
  const [isCreating, setIsCreating] = useState(false);

  // 수정 모드 상태
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [editingChannelName, setEditingChannelName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 삭제 모드 상태
  const [channelToDelete, setChannelToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 권한 확인
  const isOwner = currentProject?.ownerId === user?.userId;

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      setFetchError(null);
      try {
        // 프로젝트 상세 정보도 함께 조회하여 currentProject 업데이트
        await useProjectStore.getState().fetchProject(projectId);

        const [channelsRes, membersRes] = await Promise.all([
          projectApi.getChannels(projectId),
          projectApi.getParticipants(projectId),
        ]);
        setChannels(channelsRes.data || []);
        setMembers(membersRes.data || []);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        setFetchError('데이터를 불러올 수 없습니다');
        setChannels([]);
        setMembers([]);
      }
    };
    fetchData();
  }, [projectId]);

  // 공통 스타일 함수
  const getMenuItemClass = (active) => {
    const baseClass = "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] cursor-pointer font-medium transition-all duration-150 text-[14px]";
    if (active) return `${baseClass} bg-[var(--success-bg)] text-[var(--color-green-primary)]`;
    return `${baseClass} text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-bright)]`;
  };

  // 핸들러 함수들
  const handleChannelClick = (channel) => {
    if (isInMeeting && currentChannelId !== channel.id) {
      setPendingChannel(channel);
      setIsChannelChangeModalOpen(true);
      return;
    }
    setCurrentChannel(channel.id, channel.title, channel.sessionId, channel.mode);
    navigate(`/workspace/${projectId}/meeting/${channel.id}`);
  };

  const handleConfirmChannelChange = () => {
    if (pendingChannel) {
      leaveSession();
      setCurrentChannel(pendingChannel.id, pendingChannel.title, pendingChannel.sessionId, pendingChannel.mode);
      navigate(`/workspace/${projectId}/meeting/${pendingChannel.id}`);
    }
    setIsChannelChangeModalOpen(false);
    setPendingChannel(null);
  };

  const handleLeaveMeeting = () => {
    leaveSession();
    navigate(`/workspace/${projectId}`);
  };

  const handleMinuteClick = async (id) => {
    try {
      const response = await meetingApi.getMeetingSummaryDetail(id);
      setSelectedSummary(response.data);
    } catch (error) {
      console.error('상세 조회 실패:', error);
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      const inviteCode = await projectApi.createInvite({ projectId: Number(projectId) });
      const inviteUrl = `${window.location.origin}/invite/${inviteCode.data}`;
      await navigator.clipboard.writeText(inviteUrl);
      addToast({ type: 'success', message: '초대 링크가 복사되었습니다.' });
    } catch (error) {
      console.error("Invite failed:", error);
    } finally {
      setIsMemberMenuOpen(false);
    }
  };

  const handleMemberRemoved = (removedMemberId) => {
    setMembers(prev => prev.filter(m => m.id !== removedMemberId));
  };

  // ===== 채널 관리 핸들러 =====

  // 모드 선택
  const handleModeSelect = (mode) => {
    setChannelMode(mode);
    setChannelMenuOpen(false);
    setEditingChannelId(null);
    setEditingChannelName('');
    setNewChannelName('');
    setNewChannelType('VOICE');
  };

  // 모드 종료
  const exitMode = () => {
    setChannelMode(null);
    setEditingChannelId(null);
    setEditingChannelName('');
    setNewChannelName('');
    setNewChannelType('VOICE');
  };

  // ESC 키로 모드 종료
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && (channelMode === 'edit' || channelMode === 'delete')) {
        exitMode();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [channelMode]);

  // 채널 생성
  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await projectApi.createChannel(projectId, {
        title: newChannelName.trim(),
        mode: newChannelType,
      });
      const res = await projectApi.getChannels(projectId);
      setChannels(res.data || []);
      addToast({ type: 'success', message: '채널이 생성되었습니다.' });
      exitMode();
    } catch (error) {
      console.error('채널 생성 실패:', error);
      addToast({ type: 'error', message: '채널 생성에 실패했습니다.' });
    } finally {
      setIsCreating(false);
    }
  };

  // 채널 생성 키보드 핸들러
  const handleCreateKeyDown = (e) => {
    if (e.key === 'Enter' && newChannelName.trim()) {
      handleCreateChannel();
    }
    if (e.key === 'Escape') {
      exitMode();
    }
  };

  // 채널 수정 시작
  const handleStartEdit = (channel) => {
    setEditingChannelId(channel.id);
    setEditingChannelName(channel.title);
  };

  // 채널 수정 저장
  const handleSaveEdit = async () => {
    if (!editingChannelName.trim() || isUpdating || !editingChannelId) return;

    const currentChannel = channels.find((c) => c.id === editingChannelId);
    if (currentChannel?.title === editingChannelName.trim()) {
      setEditingChannelId(null);
      setEditingChannelName('');
      return;
    }

    setIsUpdating(true);
    try {
      await projectApi.updateChannel(editingChannelId, {
        title: editingChannelName.trim(),
      });
      const res = await projectApi.getChannels(projectId);
      setChannels(res.data || []);
      addToast({ type: 'success', message: '채널 이름이 변경되었습니다.' });
      setEditingChannelId(null);
      setEditingChannelName('');
    } catch (error) {
      console.error('채널 수정 실패:', error);
      addToast({ type: 'error', message: '채널 수정에 실패했습니다.' });
    } finally {
      setIsUpdating(false);
    }
  };

  // 채널 수정 취소
  const handleCancelEdit = () => {
    setEditingChannelId(null);
    setEditingChannelName('');
  };

  // 채널 수정 키보드 핸들러
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && editingChannelName.trim()) {
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // 채널 삭제 클릭
  const handleDeleteClick = (channel) => {
    setChannelToDelete(channel);
  };

  // 채널 삭제 확인
  const handleConfirmDelete = async () => {
    if (!channelToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await projectApi.deleteChannel(channelToDelete.id);

      // 현재 보고 있는 채널이면 홈으로 이동
      if (currentChannelId === channelToDelete.id) {
        setCurrentChannel(null, null, null, null);
        navigate(`/workspace/${projectId}`);
      }

      const res = await projectApi.getChannels(projectId);
      setChannels(res.data || []);
      addToast({
        type: 'success',
        message: `'${channelToDelete.title}' 채널이 삭제되었습니다.`,
      });
    } catch (error) {
      console.error('채널 삭제 실패:', error);
      addToast({ type: 'error', message: '채널 삭제에 실패했습니다.' });
    } finally {
      setIsDeleting(false);
      setChannelToDelete(null);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-[var(--bg-sidebar)]">
        <div className="relative flex-1 overflow-hidden">

          {/* === 1. 메인 채널 목록 뷰 === */}
          <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${viewMode === 'minutes' ? '-translate-x-full' : 'translate-x-0'}`}>
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              <div className="flex-shrink-0 px-4 mb-2 pt-2">
                <div className="h-12 flex items-center font-bold text-xl px-2 truncate">
                  {currentProject?.name || 'Loading...'}
                </div>
                <Divider className="mb-4" />

                {/* WORKSPACE 메뉴 */}
                <div className="mb-4">
                  <div className="text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 tracking-wider uppercase">WORKSPACE</div>
                  <ul className="space-y-1">
                    <li
                      onClick={() => navigate(`/workspace/${projectId}`)}
                      className={getMenuItemClass(location.pathname === `/workspace/${projectId}`)}
                    >
                      <Home size={16} /> <span>홈</span>
                    </li>
                    <li onClick={() => setViewMode('minutes')} className={getMenuItemClass(false)}>
                      <FileText size={16} /> <span>회의록</span>
                    </li>
                  </ul>
                </div>
                <Divider className="mb-4" />

                {/* CHANNELS 메뉴 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 tracking-wider uppercase group">
                    <span>CHANNELS</span>
                    <div className="relative">
                      <button
                        onClick={() => setChannelMenuOpen(!channelMenuOpen)}
                        className="text-[var(--text-tertiary)] hover:text-[var(--color-green-primary)] p-0.5 rounded focus:outline-none"
                      >
                        <Plus size={14} />
                      </button>

                      {/* 채널 관리 드롭다운 메뉴 */}
                      {channelMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setChannelMenuOpen(false)}
                          />
                          <div className="absolute right-0 top-6 w-32 bg-[var(--bg-panel)] border border-[var(--border-default)] shadow-[var(--shadow-xl)] rounded-[var(--radius-xl)] z-50 overflow-hidden py-1.5 animate-scale-in">
                            <button
                              onClick={() => handleModeSelect('create')}
                              className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                            >
                              <Plus size={14} /> 생성
                            </button>
                            <button
                              onClick={() => handleModeSelect('edit')}
                              className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                            >
                              <Pencil size={14} /> 수정
                            </button>
                            <button
                              onClick={() => handleModeSelect('delete')}
                              className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-[var(--bg-hover)] hover:text-red-600"
                            >
                              <Trash2 size={14} /> 삭제
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 모드 안내 UI */}
                  {(channelMode === 'edit' || channelMode === 'delete') && (
                    <div className="flex items-center justify-between px-2 py-1.5 bg-[var(--bg-hover)] rounded-[var(--radius-md)] mb-2 text-[11px]">
                      <span className="text-[var(--text-tertiary)]">
                        {channelMode === 'edit' ? '수정할 채널 선택' : '삭제할 채널 선택'}
                      </span>
                      <button
                        onClick={exitMode}
                        className="text-[var(--color-green-primary)] hover:underline font-medium"
                      >
                        완료
                      </button>
                    </div>
                  )}

                  <ul className="space-y-1">
                    {fetchError ? (
                      <li className="px-3 py-4 text-center text-red-400 text-xs">
                        {fetchError}
                      </li>
                    ) : channels.length > 0 ? (
                      channels
                        // [추가됨] 'SCHEDULED' 상태인 채널은 아직 시작되지 않은 예약 일정이므로,
                        // 사이드바(채팅방 목록)에서는 숨기고 캘린더에서만 보이도록 필터링합니다.
                        .filter(channel => channel.status !== 'SCHEDULED')
                        .map((channel) => {
                          const isVoiceChannel = channel.mode === 'VOICE';
                          const isSelected = currentChannelId === channel.id;
                          const isEditing = channelMode === 'edit' && editingChannelId === channel.id;

                          return (
                            <li
                              key={channel.id}
                              onClick={() => {
                                if (channelMode === 'edit' && !isEditing) {
                                  handleStartEdit(channel);
                                } else if (channelMode !== 'edit' && channelMode !== 'delete') {
                                  handleChannelClick(channel);
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] cursor-pointer text-[14px] transition-colors duration-150 ${isSelected
                                ? 'bg-[#DBEAFE] text-[#1E40AF] border-l-[3px] border-[#3B82F6] font-medium'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-bright)]'
                                }`}
                            >
                              {isVoiceChannel ? (
                                <Mic size={14} className={isSelected ? 'text-[#1E40AF]' : 'text-[var(--text-tertiary)]'} />
                              ) : (
                                <Hash size={14} className={isSelected ? 'text-[#1E40AF]' : 'text-[var(--text-tertiary)]'} />
                              )}

                              {isEditing ? (
                                <>
                                  <input
                                    type="text"
                                    value={editingChannelName}
                                    onChange={(e) => setEditingChannelName(e.target.value)}
                                    onKeyDown={handleEditKeyDown}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded px-2 py-0.5 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-green-primary)]"
                                  />
                                  <IconButton
                                    icon={<Check size={12} />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveEdit();
                                    }}
                                    disabled={!editingChannelName.trim() || isUpdating}
                                    className="text-[var(--color-green-primary)] w-6 h-6 min-w-6"
                                    title="저장"
                                  />
                                  <IconButton
                                    icon={<X size={12} />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelEdit();
                                    }}
                                    className="text-[var(--text-tertiary)] w-6 h-6 min-w-6"
                                    title="취소"
                                  />
                                </>
                              ) : (
                                <>
                                  <span className="flex-1">{channel.title}</span>
                                  {channelMode === 'edit' && (
                                    <Pencil size={12} className="text-[var(--text-tertiary)] opacity-50" />
                                  )}
                                  {channelMode === 'delete' && (
                                    <IconButton
                                      icon={<Minus size={12} />}
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(channel);
                                      }}
                                      className="text-[var(--color-error)] hover:bg-red-50 w-6 h-6 min-w-6"
                                      title="채널 삭제"
                                    />
                                  )}
                                </>
                              )}
                            </li>
                          );
                        })
                    ) : channelMode !== 'create' ? (
                      <li className="px-3 py-4 text-center text-[var(--text-tertiary)] text-xs">
                        채널이 없습니다<br />
                        <span className="text-[10px]">+ 버튼을 눌러 채널을 생성하세요</span>
                      </li>
                    ) : null}

                    {/* 채널 생성 모드 UI */}
                    {channelMode === 'create' && (
                      <li className="flex items-center gap-2 px-3 py-1.5">
                        <button
                          onClick={() => setNewChannelType(newChannelType === 'VOICE' ? 'CHAT' : 'VOICE')}
                          className="text-[var(--color-green-primary)] hover:opacity-70 transition-opacity"
                          title={newChannelType === 'VOICE' ? '음성 채널 (클릭하여 변경)' : '채팅 채널 (클릭하여 변경)'}
                        >
                          {newChannelType === 'VOICE' ? <Mic size={14} /> : <Hash size={14} />}
                        </button>
                        <input
                          type="text"
                          value={newChannelName}
                          onChange={(e) => setNewChannelName(e.target.value)}
                          onKeyDown={handleCreateKeyDown}
                          placeholder="채널 이름"
                          autoFocus
                          className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--border-default)] rounded px-2 py-0.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--color-green-primary)]"
                        />
                        <IconButton
                          icon={<Check size={12} />}
                          size="sm"
                          variant="ghost"
                          onClick={handleCreateChannel}
                          disabled={!newChannelName.trim() || isCreating}
                          className="text-[var(--color-green-primary)] w-6 h-6 min-w-6"
                          title="생성"
                        />
                        <IconButton
                          icon={<X size={12} />}
                          size="sm"
                          variant="ghost"
                          onClick={exitMode}
                          className="text-[var(--text-tertiary)] w-6 h-6 min-w-6"
                          title="취소"
                        />
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="px-4"><Divider className="mb-4" /></div>

              {/* MEMBERS 리스트 */}
              <div className="px-4 pb-4">
                {isInMeeting && participants.length > 0 ? (
                  <>
                    <div className="text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 uppercase">참가자 ({participants.length})</div>
                    <ul className="space-y-1 mb-4">
                      {participants.map((p) => (
                        <li key={p.id} className={`flex items-center gap-3 px-2 py-1.5 rounded-[var(--radius-md)] ${p.isSpeaking ? 'bg-[var(--success-bg)] ring-2 ring-[var(--color-green-primary)]' : ''}`}>
                          <Avatar name={p.name} size="xs" status="online" />
                          <span className="text-[14px] flex-1">{p.name}{p.isLocal ? ' (나)' : ''}</span>
                          {p.isSpeaking && <Mic size={14} className="text-[var(--color-green-primary)] animate-pulse" />}
                        </li>
                      ))}
                    </ul>
                    <Divider className="mb-4" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 uppercase">
                      <span>팀원 ({members.length})</span>
                      <div className="relative">
                        <button onClick={() => setIsMemberMenuOpen(!isMemberMenuOpen)} className="text-[var(--text-tertiary)] hover:text-[var(--color-green-primary)]"><Plus size={14} /></button>
                        {isMemberMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setIsMemberMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-6 w-48 bg-[var(--bg-panel)] border border-[var(--border-default)] shadow-[var(--shadow-xl)] rounded-[var(--radius-xl)] z-50 py-1.5">
                              <button onClick={handleCopyInviteLink} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--bg-hover)]"><Link size={14} /> 초대 링크 복사</button>
                              {isOwner && (
                                <button onClick={() => { setIsManageMembersModalOpen(true); setIsMemberMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-[var(--bg-hover)]"><UserMinus size={14} /> 팀원 관리</button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {members.map((m) => (
                        <li key={m.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-[var(--bg-hover)] rounded-[var(--radius-md)] cursor-pointer">
                          <Avatar name={m.name} size="xs" status={m.isOnline ? 'online' : 'offline'} />
                          <span className={`text-[14px] ${m.isOnline ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>{m.name}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* === 2. 회의록 목록 뷰 (슬라이드 인) === */}
          <div className={`absolute inset-0 flex flex-col bg-[var(--bg-sidebar)] transition-transform duration-300 ease-in-out ${viewMode === 'minutes' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-14 flex items-center gap-2 px-3 border-b border-[var(--border-default)]">
              <IconButton icon={<ArrowLeft size={18} />} variant="ghost" size="sm" onClick={() => setViewMode('channels')} />
              <span className="font-bold">회의록 목록</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <MeetingMinutesList projectId={projectId} onItemClick={handleMinuteClick} />
            </div>
          </div>
        </div>

        <Divider />

        {/* 3. 하단 컨트롤 바 */}
        <div className="flex-shrink-0 py-4 flex justify-center gap-2 px-4 bg-[var(--bg-sidebar)] mt-auto z-10">
          <IconButton icon={isSpeakerOn ? <Headphones size={18} /> : <HeadphoneOff size={18} />} variant="ghost" size="sm" onClick={toggleSpeaker} className={!isSpeakerOn ? "text-[var(--color-error)]" : ""} />
          <IconButton icon={isMicOn ? <Mic size={18} /> : <MicOff size={18} />} variant="ghost" size="sm" onClick={toggleMic} className={!isMicOn ? "text-[var(--color-error)]" : ""} />

          {isInMeeting && (
            <>
              <IconButton
                icon={isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
                variant="ghost"
                size="sm"
                onClick={toggleScreenShare}
                disabled={isScreenShareLoading}
                className={isScreenShareLoading ? "opacity-50 cursor-not-allowed" : ""}
              />
              {isRecording && <div className="flex items-center justify-center w-8 h-8"><Circle size={10} className="text-[var(--color-error)] fill-current animate-pulse" /></div>}
              <IconButton icon={<PhoneOff size={18} />} variant="ghost" size="sm" onClick={handleLeaveMeeting} className="text-[var(--text-primary)] bg-[var(--color-error)] hover:bg-red-600" />
            </>
          )}
        </div>
      </div>

      {/* 모달 영역 */}
      <ConfirmModal
        isOpen={isChannelChangeModalOpen}
        onClose={() => setIsChannelChangeModalOpen(false)}
        onConfirm={handleConfirmChannelChange}
        title="채널 이동"
        message={`현재 회의에서 나가고 '${pendingChannel?.title || ''}' 채널로 이동하시겠습니까?`}
      />

      {selectedSummary && (
        <DraggableSummaryWindow isOpen={!!selectedSummary} onClose={() => setSelectedSummary(null)} summary={selectedSummary} />
      )}

      <ManageMembersModal
        isOpen={isManageMembersModalOpen}
        onClose={() => setIsManageMembersModalOpen(false)}
        members={members}
        projectId={projectId}
        currentUserId={user?.userId}
        isOwner={isOwner}
        onMemberRemoved={handleMemberRemoved}
      />

      {/* 채널 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!channelToDelete}
        onClose={() => setChannelToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="채널 삭제"
        message={`'${channelToDelete?.title || ''}' 채널을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};

export default ChannelSidebar;
