import { useRef, useCallback, useEffect } from 'react';
import { OpenVidu } from 'openvidu-browser';
import useMeetingStore from '@/store/useMeetingStore';
import { meetingApi } from '@/api/meeting';

const useOpenVidu = () => {
  const OV = useRef(null);
  const session = useRef(null);
  const publisher = useRef(null);
  const screenPublisher = useRef(null);

  const {
    isMicOn,
    isSpeakerOn,
    isScreenSharing,
    meetingId,
    setMicOn,
    setScreenSharing,
    setScreenShareStream,
    clearScreenShare,
    addParticipant,
    removeParticipant,
    updateParticipant,
    leaveMeeting,
    setError,
  } = useMeetingStore();

  // ------------------------------------------------------------------
  // 세션 참가
  // ------------------------------------------------------------------
  const joinSession = useCallback(async (token, openviduUrl) => {
    try {
      OV.current = new OpenVidu();

      // 로그 레벨 설정 (개발 중에는 DEBUG, 프로덕션에서는 WARN)
      OV.current.setAdvancedConfiguration({
        logLevel: import.meta.env.DEV ? 'DEBUG' : 'WARN',
      });

      session.current = OV.current.initSession();

      // 이벤트 리스너 등록
      setupSessionEventListeners();

      // 세션 연결
      await session.current.connect(token);

      // 오디오 퍼블리셔 생성 (마이크만, 비디오 없음)
      publisher.current = await OV.current.initPublisherAsync(undefined, {
        audioSource: undefined, // 기본 마이크
        videoSource: false, // 비디오 없음
        publishAudio: false, // 처음에는 음소거
        publishVideo: false,
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: false,
      });

      // 퍼블리셔를 세션에 게시
      await session.current.publish(publisher.current);

      return { success: true };
    } catch (error) {
      console.error('OpenVidu 세션 참가 실패:', error);
      setError('회의 참가에 실패했습니다.');
      return { success: false, error };
    }
  }, [setError]);

  // ------------------------------------------------------------------
  // 이벤트 리스너 설정
  // ------------------------------------------------------------------
  const setupSessionEventListeners = useCallback(() => {
    if (!session.current) return;

    // 새 스트림 생성 (다른 참가자가 들어옴)
    session.current.on('streamCreated', (event) => {
      const subscriber = session.current.subscribe(event.stream, undefined);

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
    session.current.on('streamDestroyed', (event) => {
      const connectionId = event.stream.connection.connectionId;

      // 화면 공유 스트림이 종료된 경우
      if (event.stream.typeOfVideo === 'SCREEN') {
        clearScreenShare();
      }

      removeParticipant(connectionId);
    });

    // 연결 생성
    session.current.on('connectionCreated', (event) => {
      console.log('새 연결:', event.connection.connectionId);
    });

    // 연결 종료
    session.current.on('connectionDestroyed', (event) => {
      console.log('연결 종료:', event.connection.connectionId);
    });

    // 세션 연결 끊김
    session.current.on('sessionDisconnected', (event) => {
      console.log('세션 연결 끊김:', event.reason);
      cleanup();
      leaveMeeting();
    });

    // 예외 발생
    session.current.on('exception', (exception) => {
      console.warn('OpenVidu 예외:', exception);
    });

    // 음성 감지 - 말하기 시작
    session.current.on('publisherStartSpeaking', (event) => {
      updateParticipant(event.connection.connectionId, { isSpeaking: true });
    });

    // 음성 감지 - 말하기 종료
    session.current.on('publisherStopSpeaking', (event) => {
      updateParticipant(event.connection.connectionId, { isSpeaking: false });
    });
  }, [addParticipant, removeParticipant, updateParticipant, setScreenShareStream, clearScreenShare, leaveMeeting]);

  // ------------------------------------------------------------------
  // 세션 나가기
  // ------------------------------------------------------------------
  const leaveSession = useCallback(async () => {
    try {
      // API 호출로 서버에 나가기 알림
      if (meetingId) {
        await meetingApi.leaveSession(meetingId);
      }
    } catch (error) {
      console.error('회의 나가기 API 실패:', error);
    }

    cleanup();
    leaveMeeting();
  }, [meetingId, leaveMeeting]);

  // ------------------------------------------------------------------
  // 마이크 토글
  // ------------------------------------------------------------------
  const toggleMic = useCallback(() => {
    if (publisher.current) {
      const newMicState = !isMicOn;
      publisher.current.publishAudio(newMicState);
      setMicOn(newMicState);
    }
  }, [isMicOn, setMicOn]);

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
    if (!session.current || !OV.current) {
      setError('세션이 연결되지 않았습니다.');
      return { success: false };
    }

    try {
      screenPublisher.current = await OV.current.initPublisherAsync(undefined, {
        videoSource: 'screen',
        publishAudio: false,
        publishVideo: true,
        mirror: false,
      });

      // 화면 공유 중지 감지 (사용자가 브라우저에서 중지 버튼 클릭)
      screenPublisher.current.once('accessDenied', () => {
        stopScreenShare();
      });

      // 이벤트 리스너 저장 (정리용)
      const handleEnded = () => stopScreenShare();
      screenPublisher.current._endedHandler = handleEnded;

      screenPublisher.current.stream
        .getMediaStream()
        .getVideoTracks()[0]
        .addEventListener('ended', handleEnded);

      await session.current.publish(screenPublisher.current);

      // API로 화면 공유 상태 업데이트
      if (meetingId) {
        await meetingApi.updateScreenShare(meetingId, { enabled: true });
      }

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
  }, [meetingId, setScreenSharing, setError]);

  // ------------------------------------------------------------------
  // 화면 공유 중지
  // ------------------------------------------------------------------
  const stopScreenShare = useCallback(async () => {
    if (screenPublisher.current && session.current) {
      try {
        // 이벤트 리스너 정리
        const track = screenPublisher.current.stream?.getMediaStream()?.getVideoTracks()[0];
        if (track && screenPublisher.current._endedHandler) {
          track.removeEventListener('ended', screenPublisher.current._endedHandler);
        }

        await session.current.unpublish(screenPublisher.current);
        screenPublisher.current = null;

        // API로 화면 공유 상태 업데이트
        if (meetingId) {
          await meetingApi.updateScreenShare(meetingId, { enabled: false });
        }

        setScreenSharing(false);
      } catch (error) {
        console.error('화면 공유 중지 실패:', error);
      }
    }
  }, [meetingId, setScreenSharing]);

  // ------------------------------------------------------------------
  // 화면 공유 토글
  // ------------------------------------------------------------------
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  // ------------------------------------------------------------------
  // 정리
  // ------------------------------------------------------------------
  const cleanup = useCallback(() => {
    if (screenPublisher.current) {
      screenPublisher.current = null;
    }

    if (publisher.current) {
      publisher.current = null;
    }

    if (session.current) {
      session.current.disconnect();
      session.current = null;
    }

    if (OV.current) {
      OV.current = null;
    }
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
    session: session.current,
    publisher: publisher.current,
  };
};

export default useOpenVidu;
