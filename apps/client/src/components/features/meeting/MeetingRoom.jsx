import React, { useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MeetingHeader from './MeetingHeader';
import ScreenShare from './ScreenShare';
import useMeetingStore from '@/store/useMeetingStore';
import useOpenVidu from '@/hooks/useOpenVidu';
import { meetingApi } from '@/api/meeting';
import { projectApi } from '@/api/project';
import ChatChannelView from '../chat/ChatChannelView';

const MeetingRoom = () => {
  const { projectId, channelId } = useParams(); // URL에서 projectId, channelId 추출
  const navigate = useNavigate();
  const hasJoined = useRef(false);

  const {
    isInMeeting,
    currentChannelName,
    currentChannelMode,
    joinMeeting,
    setCurrentChannel,
    setLoading,
    setError,
    setParticipants,
    error,
    isLoading,
  } = useMeetingStore();

  const { joinSession, leaveSession } = useOpenVidu();

  // 1. [NEW] 채널 모드 정보가 없을 경우 (새로고침 등) 조회
  useEffect(() => {
    let ignore = false;
    if (channelId && !currentChannelMode) {
      const fetchChannelInfo = async () => {
        setLoading(true);
        try {
          const response = await projectApi.getChannel(channelId);
          if (!ignore && response.data) {
            const { id, title, sessionId, mode } = response.data;
            setCurrentChannel(id, title, sessionId, mode);
          }
        } catch (err) {
          console.error("Failed to fetch channel info:", err);
          setError("채널 정보를 불러올 수 없습니다.");
        } finally {
          if (!ignore) setLoading(false);
        }
      };
      fetchChannelInfo();
    }
    return () => { ignore = true; };
  }, [channelId, currentChannelMode, setCurrentChannel, setLoading, setError]);

  // 회의 참가 (토큰 발급 및 세션 연결)
  const handleJoinMeeting = useCallback(async () => {
    // [NEW] 모드가 없거나 CHAT 모드이면 WebRTC 연결 스킵
    if (!currentChannelMode || currentChannelMode === 'CHAT') return;

    if (hasJoined.current || isInMeeting || !channelId) return;
    hasJoined.current = true;

    setLoading(true);
    setError(null);

    try {
      // Mock 모드: VITE_USE_MOCK=true/True 또는 백엔드 URL 없을 때
      const useMock = String(import.meta.env.VITE_USE_MOCK).trim().toLowerCase() === 'true' ||
        (import.meta.env.DEV && !import.meta.env.VITE_BACKEND_URL);

      let token, sessionId, openviduUrl;

      if (useMock) {
        // Mock 데이터
        token = 'mock-token';
        sessionId = `mock-session-${channelId}`;
        openviduUrl = 'https://mock-openvidu.com';
        console.log('[DEV] Mock 모드: 백엔드 없이 회의 화면 표시');
      } else {
        // 1. API로 토큰 발급
        // 응답 형식: "ws://localhost:4443?sessionId=xxx&token=tok_xxx"
        const response = await meetingApi.joinWebRTC(Number(channelId));
        const tokenUrl = response.data;

        // URL 파싱하여 필요한 값 추출
        const url = new URL(tokenUrl);
        openviduUrl = url.origin; // "ws://localhost:4443"
        sessionId = url.searchParams.get('sessionId');
        token = tokenUrl; // OpenVidu는 전체 URL을 토큰으로 사용

        // 2. 현재 참가자 목록 조회
        try {
          const usersResponse = await meetingApi.getWebRTCUsers(Number(channelId));
          const webRTCUsers = usersResponse.data || [];
          setParticipants(webRTCUsers.map(user => ({
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            isSpeaking: false,
          })));
        } catch (err) {
          console.warn('참가자 목록 조회 실패:', err);
        }
      }

      // 3. 스토어에 회의 정보 저장
      joinMeeting({
        meetingId: Number(channelId),
        sessionId,
        openviduUrl,
        token,
        title: currentChannelName || '회의',
      });

      // 4. OpenVidu 세션 연결 (Mock 모드에서는 스킵)
      if (useMock) {
        // Mock 모드: 테스트용 참가자 추가
        setParticipants([
          { id: 'mock-1', name: '나', isSpeaking: false },
          { id: 'mock-2', name: '팀원1', isSpeaking: false },
          { id: 'mock-3', name: '팀원2', isSpeaking: false },
        ]);
      } else {
        const result = await joinSession(token, openviduUrl);
        if (!result.success) {
          throw new Error('OpenVidu 세션 연결 실패');
        }
      }
    } catch (err) {
      console.error('회의 참가 실패:', err);
      setError('회의에 참가할 수 없습니다. 다시 시도해주세요.');
      hasJoined.current = false;
    } finally {
      setLoading(false);
    }
  }, [projectId, channelId, currentChannelName, isInMeeting, joinMeeting, joinSession, setLoading, setError, setParticipants, currentChannelMode]);

  // URL에서 channelId가 바뀌면 hasJoined 리셋 (채널 변경 대응)
  useEffect(() => {
    if (channelId) {
      hasJoined.current = false; // 채널 변경 시 리셋하여 새 회의 참가 가능하게
    }
  }, [channelId]);

  // 페이지 진입 시 자동으로 회의 참가
  useEffect(() => {
    // [Updated] currentChannelMode가 로드된 후에만 시도
    if (currentChannelMode && !isInMeeting && !isLoading && channelId) {
      handleJoinMeeting();
    }
  }, [channelId, isInMeeting, isLoading, handleJoinMeeting, currentChannelMode]);

  // 페이지 떠날 때 정리
  useEffect(() => {
    return () => {
      if (isInMeeting) {
        leaveSession();
      }
      hasJoined.current = false;
    };
  }, []);

  // channelId 없음 (잘못된 URL)
  if (!channelId) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="text-center">
          <div className="text-[var(--text-secondary)] mb-4">
            회의에 참가하려면 채널을 선택해주세요.
          </div>
          <button
            onClick={() => navigate(`/workspace/${projectId}`)}
            className="px-4 py-2 rounded-md text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-green-primary)' }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--color-green-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[var(--text-secondary)]">
            {currentChannelMode === 'CHAT' ? '채널 로딩 중...' : '회의에 참가하는 중...'}
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="text-center">
          <div className="text-[var(--color-error)] mb-4">{error}</div>
          <button
            onClick={() => {
              hasJoined.current = false;
              // 재시도 시 다시 fetch 될 수 있도록
              window.location.reload();
            }}
            className="px-4 py-2 rounded-md text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-green-primary)' }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // [NEW] 채팅 모드일 경우 ChatChannelView 렌더링
  if (currentChannelMode === 'CHAT') {
    return <ChatChannelView />;
  }

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--bg-app)' }}>
      {/* 헤더 */}
      <MeetingHeader />

      {/* 메인 화면 공유 영역 */}
      <div className="flex-1 p-6">
        <ScreenShare />
      </div>
    </div>
  );
};

export default MeetingRoom;
