import { useCallback, useEffect } from 'react';
import { OpenVidu } from 'openvidu-browser';
import useMeetingStore from '@/store/useMeetingStore';
import { meetingApi } from '@/api/meeting';
import useAuthStore from '@/store/useAuthStore';

const useOpenVidu = () => {
  // ------------------------------------------------------------------
  // 스토어 액션 및 상태 가져오기 (필요할 때 getState() 사용)
  // ------------------------------------------------------------------
  const store = useMeetingStore();

  // ------------------------------------------------------------------
  // 세션 참가
  // ------------------------------------------------------------------
  const joinSession = useCallback(async (token) => {
    const {
      setOpenViduInstance,
      setOpenViduSession,
      setPublisher,
      setError
    } = useMeetingStore.getState();

    try {
      const OV = new OpenVidu();

      OV.setAdvancedConfiguration({
        logLevel: import.meta.env.DEV ? 'DEBUG' : 'WARN',
      });

      const session = OV.initSession();

      setOpenViduInstance(OV);
      setOpenViduSession(session);

      setupSessionEventListeners(session);

      const { user } = useAuthStore.getState();
      await session.connect(token, { clientData: user?.name || '가나디' });

      const currentMicState = useMeetingStore.getState().isMicOn;
      console.log(`[Mic Check] Initial Join - publishAudio: ${currentMicState}`);

      const newPublisher = await OV.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: false,
        publishAudio: currentMicState,
        publishVideo: false,
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: false,
      });

      setPublisher(newPublisher);
      await session.publish(newPublisher);

      return { success: true };
    } catch (error) {
      console.error('OpenVidu 세션 참가 실패:', error);
      setError('회의 참가에 실패했습니다.');
      return { success: false, error };
    }
  }, []);

  // ------------------------------------------------------------------
  // 이벤트 리스너 설정
  // ------------------------------------------------------------------
  const setupSessionEventListeners = useCallback((session) => {
    if (!session) return;

    const {
      setScreenShareStream,
      addParticipant,
      clearScreenShare,
      removeParticipant,
      leaveMeeting,
      updateParticipant
    } = useMeetingStore.getState();

    session.on('streamCreated', (event) => {
      const subscriber = session.subscribe(event.stream, undefined);
      const connectionId = event.stream.connection.connectionId;
      const data = JSON.parse(event.stream.connection.data || '{}');
      const participantName = data.clientData || '가나디';

      if (event.stream.typeOfVideo === 'SCREEN') {
        const { setScreenShareStream, setScreenSharing } = useMeetingStore.getState();
        setScreenShareStream(subscriber, participantName);
        setScreenSharing(true);
        return;
      }

      // 기존 참가자 정보 업데이트 (connectionCreated에서 이미 추가됨)
      updateParticipant(connectionId, {
        stream: subscriber,
      });
    });

    session.on('streamDestroyed', (event) => {
      const connectionId = event.stream.connection.connectionId;
      if (event.stream.typeOfVideo === 'SCREEN') {
        clearScreenShare();
      } else {
        // 일반 스트림만 제거 (참가자 자체는 connectionDestroyed에서 제거)
        updateParticipant(connectionId, { stream: null });
      }
    });

    session.on('connectionCreated', (event) => {
      console.log('새 연결 생성:', event.connection.connectionId);
      const data = JSON.parse(event.connection.data || '{}');
      const participantName = data.clientData || '가나디';

      // 본인 연결은 제외 (이미 로컬에서 관리)
      if (event.connection.connectionId !== session.connection.connectionId) {
        addParticipant({
          id: event.connection.connectionId,
          name: participantName,
          stream: null,
          isSpeaking: false,
        });
      }
    });

    session.on('connectionDestroyed', (event) => {
      console.log('연결 종료:', event.connection.connectionId);
      removeParticipant(event.connection.connectionId);
    });

    session.on('sessionDisconnected', (event) => {
      console.log('세션 연결 끊김:', event.reason);
      // 이미 스토어에서 세션이 사라진 경우(정상 종료 과정) redundant 호출 방지
      const currentSession = useMeetingStore.getState().openviduSession;
      if (currentSession) {
        cleanup();
        leaveMeeting();
      }
    });

    session.on('exception', (exception) => {
      console.warn('OpenVidu 예외:', exception);
    });

    session.on('publisherStartSpeaking', (event) => {
      updateParticipant(event.connection.connectionId, { isSpeaking: true });
    });

    session.on('publisherStopSpeaking', (event) => {
      updateParticipant(event.connection.connectionId, { isSpeaking: false });
    });
  }, []);

  // ------------------------------------------------------------------
  // 세션 나가기
  // ------------------------------------------------------------------
  const leaveSession = useCallback(async () => {
    const { currentChannelId, leaveMeeting } = useMeetingStore.getState();

    try {
      if (currentChannelId) {
        await meetingApi.leaveWebRTC(currentChannelId);
      }
    } catch (error) {
      console.error('회의 나가기 API 실패:', error);
    }

    cleanup();
    leaveMeeting();
  }, []);

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
  // 화면 공유 시작 (기존 오디오 Publisher를 화면+오디오 Publisher로 교체)
  // ------------------------------------------------------------------
  const startScreenShare = useCallback(async () => {
    const {
      openviduSession: session,
      openviduInstance: OV,
      isScreenSharing,
      isScreenShareLoading,
      publisher: currentPublisher,
      screenPublisher,
      setScreenShareLoading,
      setPublisher,
      setScreenPublisher,
      setScreenSharing,
      setError,
    } = useMeetingStore.getState();

    if (isScreenShareLoading || isScreenSharing || screenPublisher) {
      console.warn('이미 화면 공유가 활성화되어 있거나 처리 중입니다.');
      return { success: false };
    }

    if (!session || !OV) {
      useMeetingStore.getState().setError('세션이 연결되지 않았습니다.');
      return { success: false };
    }

    useMeetingStore.getState().setScreenShareLoading(true);

    try {
      if (currentPublisher) {
        await session.unpublish(currentPublisher);
        useMeetingStore.getState().setPublisher(null);
      }

      const currentMicState = useMeetingStore.getState().isMicOn;
      console.log(`[Mic Check] Start ScreenShare - publishAudio: ${currentMicState}`);
      const newScreenPublisher = await OV.initPublisherAsync(undefined, {
        videoSource: 'screen',
        audioSource: undefined,
        publishAudio: currentMicState,
        publishVideo: true,
        mirror: false,
      });

      newScreenPublisher.once('accessAllowed', () => {
        console.log('화면 공유 권한 허용됨');
      });
      newScreenPublisher.once('accessDenied', () => {
        console.warn('화면 공유 권한 거부됨');
        stopScreenShare();
      });

      const handleEnded = () => {
        console.log('화면 공유 트랙 종료됨 (handleEnded)');
        stopScreenShare();
      };
      newScreenPublisher._endedHandler = handleEnded;
      const tracks = newScreenPublisher.stream?.getMediaStream()?.getVideoTracks();
      if (tracks && tracks[0]) {
        tracks[0].addEventListener('ended', handleEnded);
      }

      await session.publish(newScreenPublisher);

      const { user } = useAuthStore.getState();
      const { setScreenShareStream } = useMeetingStore.getState();

      setScreenPublisher(newScreenPublisher);
      setPublisher(newScreenPublisher);
      setScreenSharing(true);
      setScreenShareStream(newScreenPublisher, user?.name || '나');

      console.log('화면 공유 시작 성공 (로컬 스트림 설정됨)');
      return { success: true };
    } catch (error) {
      console.error('화면 공유 시작 실패:', error);
      // 실패 시 오디오 전용 퍼블리셔 복구 시도
      await restoreAudioOnlyPublisher();
      if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
        useMeetingStore.getState().setError('화면 공유 권한이 거부되었습니다.');
      } else {
        useMeetingStore.getState().setError('화면 공유를 시작할 수 없습니다.');
      }
      return { success: false, error };
    } finally {
      useMeetingStore.getState().setScreenShareLoading(false);
    }
  }, []);

  // ------------------------------------------------------------------
  // 화면 공유 중지 (화면+오디오 Publisher를 오디오 전용 Publisher로 교체)
  // ------------------------------------------------------------------
  const stopScreenShare = useCallback(async () => {
    const {
      openviduSession: session,
      isScreenShareLoading,
      screenPublisher: currentScreenPublisher,
      setScreenShareLoading,
      setScreenPublisher,
      setPublisher,
      setScreenSharing,
    } = useMeetingStore.getState();

    console.log('화면 공유 중지 호출됨');
    if (isScreenShareLoading) return;

    setScreenShareLoading(true);

    try {
      if (currentScreenPublisher && session) {
        console.log('화면 공유 Publisher unpublish 진행 중...');
        const track = currentScreenPublisher.stream?.getMediaStream()?.getVideoTracks()[0];
        if (track && currentScreenPublisher._endedHandler) {
          track.removeEventListener('ended', currentScreenPublisher._endedHandler);
        }

        await session.unpublish(currentScreenPublisher);
        setScreenPublisher(null);
        setPublisher(null);
        setScreenSharing(false);
      }

      await restoreAudioOnlyPublisher();
    } catch (error) {
      console.error('화면 공유 중지 실패:', error);
    } finally {
      setScreenShareLoading(false);
    }
  }, []);

  // ------------------------------------------------------------------
  // 오디오 전용 Publisher 복구 (내부 헬퍼)
  // ------------------------------------------------------------------
  const restoreAudioOnlyPublisher = async () => {
    const {
      openviduSession: session,
      openviduInstance: OV,
      publisher,
      setPublisher
    } = useMeetingStore.getState();

    // 이미 publisher가 있으면(복구 불필요) 스킵
    if (publisher || !session || !OV) return;

    try {
      const currentMicState = useMeetingStore.getState().isMicOn;
      console.log(`[Mic Check] Restore Audio - publishAudio: ${currentMicState}`);
      const newPublisher = await OV.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: false,
        publishAudio: currentMicState,
        publishVideo: false,
      });

      await session.publish(newPublisher);
      setPublisher(newPublisher);
    } catch (error) {
      console.error('오디오 퍼블리셔 복구 실패:', error);
    }
  };

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

    // 1. 상태를 먼저 초기화하여 재귀적 이벤트 트리거 시 skip 가능하게 함
    setScreenPublisher(null);
    setPublisher(null);
    setOpenViduSession(null);
    setOpenViduInstance(null);

    // 2. 그 후 실제 연결 종료
    if (session) {
      try {
        session.disconnect();
      } catch (e) {
        console.warn('세션 종료 중 오류(이미 종료됨):', e);
      }
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
  };
};

export default useOpenVidu;
