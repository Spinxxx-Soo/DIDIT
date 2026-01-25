import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Home, Mic, FileText, Hash, Plus, Headphones, MicOff, HeadphoneOff, PhoneOff, Monitor, MonitorOff, Circle } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Divider } from '@/components/common/Divider';
import { IconButton } from '@/components/common/Button/IconButton';
import useMeetingStore from '@/store/useMeetingStore';
import useOpenVidu from '@/hooks/useOpenVidu';
import { projectApi } from '@/api/project';

const ChannelSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams();

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

  // 채널/멤버 데이터 로드
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
    // 채널 선택 상태 저장 (UI 상태용)
    setCurrentChannel(channel.id, channel.title, channel.sessionId);
    // 회의 페이지로 이동 (URL에 channelId 포함)
    navigate(`/workspace/${projectId}/meeting/${channel.id}`);
  };

  return (
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
              onClick={() => {/* TODO: 회의록 목록 표시 */}}
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] cursor-pointer text-[14px] transition-colors duration-150 ${
                    isSelected
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
                  className={`flex items-center gap-3 px-2 py-1.5 rounded-[var(--radius-md)] transition-colors duration-150 ${
                    participant.isSpeaking ? 'bg-[var(--success-bg)] ring-2 ring-[var(--color-green-primary)]' : 'hover:bg-[var(--bg-hover)]'
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

        {/* 팀원 목록 */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)] font-semibold mb-3 tracking-wider uppercase group sticky top-0 bg-[var(--bg-sidebar)] py-1 z-10">
          <span>팀원 ({members.length})</span>
          <button className="text-[var(--text-tertiary)] hover:text-[var(--color-green-primary)]">
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
              onClick={leaveSession}
              className="text-white bg-[var(--color-error)] hover:bg-red-600"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ChannelSidebar;
