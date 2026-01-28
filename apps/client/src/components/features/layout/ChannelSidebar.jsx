import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Home, Mic, FileText, Hash, Plus, Headphones, MicOff, HeadphoneOff, PhoneOff, Monitor, MonitorOff, Circle, ArrowLeft, Settings, Copy, UserMinus, Link } from 'lucide-react';
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

  // UI 상태
  const [isChannelChangeModalOpen, setIsChannelChangeModalOpen] = useState(false);
  const [pendingChannel, setPendingChannel] = useState(null);
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('channels'); // 'channels' | 'minutes'
  const [selectedSummary, setSelectedSummary] = useState(null);

  // 권한 확인
  const isOwner = currentProject?.ownerId === user?.userId;

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      try {
        const [channelsRes, membersRes] = await Promise.all([
          projectApi.getChannels(projectId),
          projectApi.getParticipants(projectId),
        ]);
        setChannels(channelsRes.data || []);
        setMembers(membersRes.data || []);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        // API 실패 시 임시 데이터 사용 (개발용)
        setChannels([
          { id: 1, title: '일반', sessionId: null, status: 'RUNNING', mode: 'CHAT' },
          { id: 2, title: '개발 회의', sessionId: 'OV_SESSION_10', status: 'RUNNING', mode: 'VOICE' },
        ]);
        setMembers([
          { id: 1, name: '팀원1', isOnline: true },
          { id: 2, name: '팀원2', isOnline: false },
        ]);
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

  return (
    <>
      <div className="flex flex-col h-full bg-[var(--bg-sidebar)]">
        <div className="relative flex-1 overflow-hidden">

          {/* === 1. 메인 채널 목록 뷰 === */}
          <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${viewMode === 'minutes' ? '-translate-x-full' : 'translate-x-0'}`}>
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              <div className="flex-shrink-0 px-4 mb-2 pt-2">
                <div className="h-12 flex items-center font-bold text-xl">공통 PJT</div>
                <Divider className="mb-4" />

                {/* WORKSPACE 메뉴 */}
                <div className="mb-4">
                  <div className="text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 tracking-wider uppercase">WORKSPACE</div>
                  <ul className="space-y-1">
                    <li onClick={() => navigate(`/workspace/${projectId}`)} className={getMenuItemClass(location.pathname === `/workspace/${projectId}`)}>
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
                    <button className="text-[var(--text-tertiary)] hover:text-[var(--color-green-primary)]"><Plus size={14} /></button>
                  </div>
                  <ul className="space-y-1">
                    {channels.map((channel) => {
                      const isSelected = currentChannelId === channel.id;
                      return (
                        <li key={channel.id} onClick={() => handleChannelClick(channel)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] cursor-pointer text-[14px] transition-colors duration-150 ${isSelected ? 'bg-[#DBEAFE] text-[#1E40AF] border-l-[3px] border-[#3B82F6] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}>
                          {channel.mode === 'VOICE' ? <Mic size={14} /> : <Hash size={14} />}
                          {channel.title}
                        </li>
                      );
                    })}
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
                          <span className="text-[14px] flex-1">{p.name}</span>
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
                          <div className="absolute right-0 top-6 w-48 bg-white dark:bg-gray-800 border border-gray-200 shadow-xl rounded-md z-50 py-1">
                            <button onClick={handleCopyInviteLink} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--bg-hover)]"><Link size={14} /> 초대 링크 복사</button>
                            {isOwner && (
                              <button onClick={() => { setIsManageMembersModalOpen(true); setIsMemberMenuOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-[var(--bg-hover)]"><UserMinus size={14} /> 팀원 관리</button>
                            )}
                          </div>
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
              <IconButton icon={isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />} variant="ghost" size="sm" onClick={toggleScreenShare} />
              {isRecording && <div className="flex items-center justify-center w-8 h-8"><Circle size={10} className="text-[var(--color-error)] fill-current animate-pulse" /></div>}
              <IconButton icon={<PhoneOff size={18} />} variant="ghost" size="sm" onClick={handleLeaveMeeting} className="text-white bg-[var(--color-error)] hover:bg-red-600" />
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
    </>
  );
};

export default ChannelSidebar;
