import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Home, Mic, FileText, Hash, Plus, Headphones, MicOff, HeadphoneOff, PhoneOff, Monitor, MonitorOff, Circle } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Divider } from '@/components/common/Divider';
import { IconButton } from '@/components/common/Button/IconButton';
import { ConfirmModal } from '@/components/common/Modal/ConfirmModal';
import useMeetingStore from '@/store/useMeetingStore';
import useOpenVidu from '@/hooks/useOpenVidu';
import { projectApi } from '@/api/project';

import { ManageMembersModal } from '@/components/features/project/ManageMembersModal';
import useAuthStore from '@/store/useAuthStore';
import useProjectStore from '@/store/useProjectStore';
import useToastStore from '@/store/useToastStore';
import { Settings, Copy, UserMinus, Link } from 'lucide-react';

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

  // 채널 및 멤버 데이터 (API 연동)
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);

  // UI 상태
  const [isChannelChangeModalOpen, setIsChannelChangeModalOpen] = useState(false);
  const [pendingChannel, setPendingChannel] = useState(null);
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);

  // 권한 확인
  const isOwner = currentProject?.ownerId === user?.userId;

  // 채널/멤버 데이터 로드
  useEffect(() => {
    // ... existing fetching logic
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
        console.error('채널/멤버 데이터 로드 실패:', error);
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

  // 디자인 가이드 nav-item 패턴 적용
  const getMenuItemClass = (active) => {
    const baseClass = "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] cursor-pointer font-medium transition-all duration-150 text-[14px]";

    if (active) {
      return `${baseClass} bg-[var(--success-bg)] text-[var(--color-green-primary)]`;
    }
    return `${baseClass} text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-bright)]`;
  };

  // 채널 클릭 핸들러
  const handleChannelClick = (channel) => {
    // 회의 중이고 다른 채널 클릭 시 확인 모달 표시
    if (isInMeeting && currentChannelId !== channel.id) {
      setPendingChannel(channel);
      setIsChannelChangeModalOpen(true);
      return;
    }

    // 채널 선택 상태 저장 (UI 상태용)
    setCurrentChannel(channel.id, channel.title, channel.sessionId, channel.mode);
    // 회의 페이지로 이동 (URL에 channelId 포함)
    navigate(`/workspace/${projectId}/meeting/${channel.id}`);
  };

  // 채널 변경 확인 핸들러
  const handleConfirmChannelChange = () => {
    if (pendingChannel) {
      // 이전 세션 나가기
      leaveSession();
      // 새 채널로 이동
      setCurrentChannel(pendingChannel.id, pendingChannel.title, pendingChannel.sessionId, pendingChannel.mode);
      navigate(`/workspace/${projectId}/meeting/${pendingChannel.id}`);
    }
    setIsChannelChangeModalOpen(false);
    setPendingChannel(null);
  };

  // 회의 나가기 핸들러 (홈으로 리다이렉트)
  const handleLeaveMeeting = () => {
    leaveSession();
    navigate(`/workspace/${projectId}`);
  };

  // 초대 링크 복사
  const handleCopyInviteLink = async () => {
    try {
      const inviteCode = await projectApi.createInvite({ projectId: Number(projectId) });
      const inviteUrl = `${window.location.origin}/invite/${inviteCode.data}`; // Adjust response data access

      await navigator.clipboard.writeText(inviteUrl);
      addToast({ type: 'success', message: '초대 링크가 클립보드에 복사되었습니다.' });
    } catch (error) {
      console.error("Invite creation failed:", error);
      // Mock fallback
      const mockCode = "invite-mock-123";
      const inviteUrl = `${window.location.origin}/invite/${mockCode}`;
      await navigator.clipboard.writeText(inviteUrl);
      addToast({ type: 'success', message: '초대 링크가 복사되었습니다. (Mock)' });
    } finally {
      setIsMemberMenuOpen(false);
    }
  };

  // 팀원 관리 모달 열기
  const handleOpenManageMembers = () => {
    setIsManageMembersModalOpen(true);
    setIsMemberMenuOpen(false);
  };

  const handleMemberRemoved = (removedMemberId) => {
    setMembers(prev => prev.filter(m => m.id !== removedMemberId));
  };

  return (
    <>
      <div className="flex flex-col h-full pt-2 bg-[var(--bg-sidebar)]">
        {/* 1. 상단 고정 영역 */}
        <div className="flex-shrink-0 px-4 mb-2">
          {/* 헤더 */}
          <div className="h-12 flex items-center font-bold text-xl" >
            공통 PJT
          </div>
          <Divider className="mb-4" />

          {/* WORKSPACE 메뉴 */}
          <div className="mb-4">
            <div className="text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 tracking-wider uppercase">
              WORKSPACE
            </div>
            <ul className="space-y-1">
              <li
                onClick={() => navigate(`/workspace/${projectId}`)}
                className={getMenuItemClass(location.pathname === `/workspace/${projectId}` || location.pathname === `/workspace/${projectId}/`)}
              >
                <Home size={16} /> <span>홈</span>
              </li>
              <li
                onClick={() => {/* TODO: 회의록 목록 표시 */ }}
                className={getMenuItemClass(false)}
              >
                <FileText size={16} /> <span>회의록</span>
              </li>
            </ul>
          </div>
          <Divider className="mb-4" />

          {/* CHANNELS 메뉴 */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 tracking-wider uppercase group">
              <span>CHANNELS</span>
              <button className="text-[var(--text-tertiary)] hover:text-[var(--color-green-primary)]">
                <Plus size={14} />
              </button>
            </div>
            <ul className="space-y-1">
              {channels.map((channel) => {
                const isVoiceChannel = channel.mode === 'VOICE';
                const isSelected = currentChannelId === channel.id;

                return (
                  <li
                    key={channel.id}
                    onClick={() => handleChannelClick(channel)}
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
                    {channel.title}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="px-4">
          <Divider className="mb-4" />
        </div>


        {/* 구분선 */}
        {/* 2. 하단 스크롤 영역 (MEMBERS 리스트) */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
          {/* 회의 중일 때: 참가자 목록 표시 */}
          {isInMeeting && participants.length > 0 && (
            <>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 tracking-wider uppercase group sticky top-0 bg-[var(--bg-sidebar)] py-1 z-10">
                <span>참가자 ({participants.length})</span>
              </div>
              <ul className="space-y-1 mb-4">
                {participants.map((participant) => (
                  <li
                    key={participant.id}
                    className={`flex items-center gap-3 px-2 py-1.5 rounded-[var(--radius-md)] transition-colors duration-150 ${participant.isSpeaking ? 'bg-[var(--success-bg)] ring-2 ring-[var(--color-green-primary)]' : 'hover:bg-[var(--bg-hover)]'
                      }`}
                  >
                    <Avatar
                      name={participant.name}
                      size="xs"
                      status="online"
                    />
                    <span className="text-[14px] text-[var(--text-primary)] flex-1">
                      {participant.name}
                    </span>
                    {participant.isSpeaking && (
                      <Mic size={14} className="text-[var(--color-green-primary)] animate-pulse" />
                    )}
                  </li>
                ))}
              </ul>
              <Divider className="mb-4" />
            </>
          )}

          {/* 팀원 목록 - 회의 참가 중이 아닐 때만 표시 */}
          {!isInMeeting && (
            <>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 tracking-wider uppercase group sticky top-0 bg-[var(--bg-sidebar)] py-1 z-10">
                <span>팀원 ({members.length})</span>
                <div className="relative">
                  <button
                    onClick={() => setIsMemberMenuOpen(!isMemberMenuOpen)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--color-green-primary)] p-0.5 rounded focus:outline-none"
                  >
                    <Plus size={14} />
                  </button>

                  {/* Popover Menu */}
                  {isMemberMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsMemberMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-6 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-md z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        <button
                          onClick={handleCopyInviteLink}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                        >
                          <Link size={14} /> 초대 링크 복사
                        </button>
                        {isOwner && (
                          <button
                            onClick={handleOpenManageMembers}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] text-red-500 hover:text-red-600"
                          >
                            <UserMinus size={14} /> 팀원 관리
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
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
            </>
          )}
        </div>

        <Divider />

        {/* 3. 하단 컨트롤 바 */}
        <div className="flex-shrink-0 py-4 flex justify-center gap-2 px-4 bg-[var(--bg-sidebar)] mt-auto">
          {/* 스피커(헤드폰) 버튼 */}
          <IconButton
            icon={isSpeakerOn ? <Headphones size={18} /> : <HeadphoneOff size={18} />}
            variant="ghost"
            size="sm"
            title={isSpeakerOn ? "스피커 끄기" : "스피커 켜기"}
            onClick={toggleSpeaker}
            className={!isSpeakerOn ? "text-[var(--color-error)] hover:text-[var(--color-error)]" : ""}
          />

          {/* 마이크 버튼 */}
          <IconButton
            icon={isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            variant="ghost"
            size="sm"
            title={isMicOn ? "마이크 끄기" : "마이크 켜기"}
            onClick={toggleMic}
            className={!isMicOn ? "text-[var(--color-error)] hover:text-[var(--color-error)]" : ""}
          />

          {/* 회의 중일 때만 추가 버튼 표시 */}
          {isInMeeting && (
            <>
              {/* 화면 공유 버튼 */}
              <IconButton
                icon={isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
                variant="ghost"
                size="sm"
                title={isScreenSharing ? "화면 공유 중지" : "화면 공유"}
                onClick={toggleScreenShare}
                className={isScreenSharing ? "text-[var(--color-green-primary)] hover:text-[var(--color-green-primary)]" : ""}
              />

              {/* 녹음 상태 표시 */}
              {isRecording && (
                <div className="flex items-center justify-center w-8 h-8">
                  <Circle size={10} className="text-[var(--color-error)] fill-current animate-pulse" />
                </div>
              )}

              {/* 나가기 버튼 */}
              <IconButton
                icon={<PhoneOff size={18} />}
                variant="ghost"
                size="sm"
                title="회의 나가기"
                onClick={handleLeaveMeeting}
                className="text-[var(--text-bright)] bg-[var(--color-error)] hover:bg-red-600"
              />
            </>
          )}
        </div>
      </div>

      {/* 채널 변경 확인 모달 */}
      <ConfirmModal
        isOpen={isChannelChangeModalOpen}
        onClose={() => {
          setIsChannelChangeModalOpen(false);
          setPendingChannel(null);
        }}
        onConfirm={handleConfirmChannelChange}
        title="채널 이동"
        message={`현재 회의에서 나가고 '${pendingChannel?.title || ''}' 채널로 이동하시겠습니까?`}
        confirmText="이동하기"
        cancelText="취소"
        confirmVariant="primary"
      />

      {/* 팀원 관리 모달 */}
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
