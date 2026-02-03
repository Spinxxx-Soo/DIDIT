import { useCallback, useEffect } from 'react';
import { OpenVidu } from 'openvidu-browser';
import useMeetingStore from '@/store/useMeetingStore';
import { meetingApi } from '@/api/meeting';

const useOpenVidu = () => {
  // 스토어에서 상태 가져오기
  const {
    setScreenSharing,
    setScreenShareStream,
    clearScreenShare,
    addParticipant,
    removeParticipant,
    updateParticipant,
    leaveMeeting,
    setError,
    // OpenVidu 세션 관련 setter (전역 공유)
    setOpenViduSession,
    setOpenViduInstance,
    setPublisher,
    setScreenPublisher,
  } = useMeetingStore();

  // ------------------------------------------------------------------
  // 세션 참가
  // ------------------------------------------------------------------
  const joinSession = useCallback(async (token) => {
    try {
      const OV = new OpenVidu();

      // 로그 레벨 설정 (개발 중에는 DEBUG, 프로덕션에서는 WARN)
      OV.setAdvancedConfiguration({
        logLevel: import.meta.env.DEV ? 'DEBUG' : 'WARN',
      });

      const session = OV.initSession();

      // 스토어에 저장 (전역 공유)
      setOpenViduInstance(OV);
      setOpenViduSession(session);

      // 이벤트 리스너 등록
      setupSessionEventListeners(session);

      // 세션 연결
      await session.connect(token);

      // 현재 마이크 상태 가져오기 (회의 참가 전 미리 설정된 상태 반영)
      const currentMicState = useMeetingStore.getState().isMicOn;

      // 오디오 퍼블리셔 생성 (마이크만, 비디오 없음)
      const newPublisher = await OV.initPublisherAsync(undefined, {
        audioSource: undefined, // 기본 마이크
        videoSource: false, // 비디오 없음
        publishAudio: currentMicState, // 미리 설정된 마이크 상태 적용
        publishVideo: false,
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: false,
      });

      // 스토어에 저장
      setPublisher(newPublisher);

      // 퍼블리셔를 세션에 게시
      await session.publish(newPublisher);

      return { success: true };
    } catch (error) {
      console.error('OpenVidu 세션 참가 실패:', error);
      setError('회의 참가에 실패했습니다.');
      return { success: false, error };
    }
  }, [setError, setOpenViduInstance, setOpenViduSession, setPublisher]);

  // ------------------------------------------------------------------
  // 이벤트 리스너 설정
  // ------------------------------------------------------------------
  const setupSessionEventListeners = useCallback((session) => {
    if (!session) return;

    // 새 스트림 생성 (다른 참가자가 들어옴)
    session.on('streamCreated', (event) => {
      const subscriber = session.subscribe(event.stream, undefined);

      const participant = {
        id: event.stream.connection.connectionId,
        name: JSON.parse(event.stream.connection.data || '{}').clientData || '익명',
        stream: subscriber,
        isScreenShare: event.stream.typeOfVideo === 'SCREEN',
      };

      // 화면 공유 스트림인 경우
      if (participant.isScreenShare) {
        setScreenShareStream(subscriber, participant.name);
      }

      addParticipant(participant);
    });

    // 스트림 삭제 (다른 참가자가 나감)
    session.on('streamDestroyed', (event) => {
      const connectionId = event.stream.connection.connectionId;

      // 화면 공유 스트림이 종료된 경우
      if (event.stream.typeOfVideo === 'SCREEN') {
        clearScreenShare();
      }

      removeParticipant(connectionId);
    });

    // 연결 생성
    session.on('connectionCreated', (event) => {
      console.log('새 연결:', event.connection.connectionId);
    });

    // 연결 종료
    session.on('connectionDestroyed', (event) => {
      console.log('연결 종료:', event.connection.connectionId);
    });

    // 세션 연결 끊김
    session.on('sessionDisconnected', (event) => {
      console.log('세션 연결 끊김:', event.reason);
      cleanup();
      leaveMeeting();
    });

    // 예외 발생
    session.on('exception', (exception) => {
      console.warn('OpenVidu 예외:', exception);
    });

    // 음성 감지 - 말하기 시작
    session.on('publisherStartSpeaking', (event) => {
      updateParticipant(event.connection.connectionId, { isSpeaking: true });
    });

    // 음성 감지 - 말하기 종료
    session.on('publisherStopSpeaking', (event) => {
      updateParticipant(event.connection.connectionId, { isSpeaking: false });
    });
  }, [addParticipant, removeParticipant, updateParticipant, setScreenShareStream, clearScreenShare, leaveMeeting]);

  // ------------------------------------------------------------------
  // 세션 나가기
  // ------------------------------------------------------------------
  const leaveSession = useCallback(async () => {
    const { currentChannelId } = useMeetingStore.getState();

    try {
      // API 호출로 서버에 나가기 알림
      if (currentChannelId) {
        await meetingApi.leaveWebRTC(currentChannelId);
      }
    } catch (error) {
      console.error('회의 나가기 API 실패:', error);
    }

    cleanup();
    leaveMeeting();
  }, [leaveMeeting]);

  // ------------------------------------------------------------------
  // 마이크 토글
  // NOTE: getState()는 항상 최신 상태를 반환하므로 의존성 배열 비워도 정상 동작
  // ------------------------------------------------------------------
  const toggleMic = useCallback(() => {
    const { isMicOn, setMicOn, publisher: currentPublisher } = useMeetingStore.getState();
    const newMicState = !isMicOn;
    // 세션에 연결된 경우 실제 오디오 스트림도 제어
    if (currentPublisher) {
      currentPublisher.publishAudio(newMicState);
    }
    // 상태는 항상 업데이트 (회의 참가 전 미리 설정 가능)
    setMicOn(newMicState);
  }, []);

  // ------------------------------------------------------------------
  // 스피커 토글 (볼륨 뮤트)
  // NOTE: getState()는 항상 최신 상태를 반환하므로 의존성 배열 비워도 정상 동작
  // React 훅 규칙상 비권장 패턴이나, 클로저 문제 회피를 위해 의도적으로 사용
  // ------------------------------------------------------------------
  const toggleSpeaker = useCallback(() => {
    const { isSpeakerOn, setSpeakerOn, participants } = useMeetingStore.getState();
    const newSpeakerState = !isSpeakerOn;

    // 모든 subscriber의 오디오 뮤트/언뮤트
    participants.forEach((participant) => {
      if (participant.stream && participant.stream.subscribeToAudio) {
        participant.stream.subscribeToAudio(newSpeakerState);
      }
    });

    setSpeakerOn(newSpeakerState);
  }, []);

  // ------------------------------------------------------------------
  // 화면 공유 시작
  // ------------------------------------------------------------------
  const startScreenShare = useCallback(async () => {
    const { openviduSession: session, openviduInstance: OV } = useMeetingStore.getState();

    if (!session || !OV) {
      setError('세션이 연결되지 않았습니다.');
      return { success: false };
    }

    try {
      const newScreenPublisher = await OV.initPublisherAsync(undefined, {
        videoSource: 'screen',
        publishAudio: false,
        publishVideo: true,
        mirror: false,
      });

      // 화면 공유 중지 감지 (사용자가 브라우저에서 중지 버튼 클릭)
      newScreenPublisher.once('accessDenied', () => {
        stopScreenShare();
      });

      // 이벤트 리스너 저장 (정리용)
      const handleEnded = () => stopScreenShare();
      newScreenPublisher._endedHandler = handleEnded;

      newScreenPublisher.stream
        .getMediaStream()
        .getVideoTracks()[0]
        .addEventListener('ended', handleEnded);

      // 스토어에 저장
      setScreenPublisher(newScreenPublisher);

      await session.publish(newScreenPublisher);
      setScreenSharing(true);
      return { success: true };
    } catch (error) {
      console.error('화면 공유 시작 실패:', error);

      if (error.name === 'NotAllowedError') {
        setError('화면 공유 권한이 거부되었습니다.');
      } else {
        setError('화면 공유를 시작할 수 없습니다.');
      }

      return { success: false, error };
    }
  }, [setScreenSharing, setError, setScreenPublisher]);

  // ------------------------------------------------------------------
  // 화면 공유 중지
  // ------------------------------------------------------------------
  const stopScreenShare = useCallback(async () => {
    const { openviduSession: session, screenPublisher: currentScreenPublisher } = useMeetingStore.getState();

    if (currentScreenPublisher && session) {
      try {
        // 이벤트 리스너 정리
        const track = currentScreenPublisher.stream?.getMediaStream()?.getVideoTracks()[0];
        if (track && currentScreenPublisher._endedHandler) {
          track.removeEventListener('ended', currentScreenPublisher._endedHandler);
        }

        await session.unpublish(currentScreenPublisher);
        setScreenPublisher(null);
        setScreenSharing(false);
      } catch (error) {
        console.error('화면 공유 중지 실패:', error);
      }
    }
  }, [setScreenSharing, setScreenPublisher]);

  // ------------------------------------------------------------------
  // 화면 공유 토글
  // NOTE: getState()는 항상 최신 상태를 반환하므로 의존성 배열에서 isScreenSharing 제외
  // ------------------------------------------------------------------
  const toggleScreenShare = useCallback(async () => {
    const { isScreenSharing } = useMeetingStore.getState();
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [startScreenShare, stopScreenShare]);

  // ------------------------------------------------------------------
  // 정리
  // ------------------------------------------------------------------
  const cleanup = useCallback(() => {
    const {
      openviduSession: session,
      setOpenViduSession,
      setOpenViduInstance,
      setPublisher,
      setScreenPublisher,
    } = useMeetingStore.getState();

    setScreenPublisher(null);
    setPublisher(null);

    if (session) {
      session.disconnect();
      setOpenViduSession(null);
    }

    setOpenViduInstance(null);
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    joinSession,
    leaveSession,
    toggleMic,
    toggleSpeaker,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
  };
};

export default useOpenVidu;
