import { useCallback, useEffect } from 'react';
import { OpenVidu } from 'openvidu-browser';
import useMeetingStore from '@/store/useMeetingStore';
import { meetingApi } from '@/api/meeting';
import useAuthStore from '@/store/useAuthStore';

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
    setPublisher,
    setScreenPublisher,
    setScreenShareLoading,
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
      const { user } = useAuthStore.getState();
      await session.connect(token, { clientData: user?.name || '가나디' });

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
      const data = JSON.parse(event.stream.connection.data || '{}');
      const participantName = data.clientData || '가나디';

      // 화면 공유 스트림인 경우
      if (event.stream.typeOfVideo === 'SCREEN') {
        setScreenShareStream(subscriber, participantName);
        return; // ★ 중요: 여기서 끝내야 합니다. addParticipant까지 내려가면 안 돼요!
      }

      // 2. 일반 참가자일 때만 리스트에 추가
      addParticipant({
        id: event.stream.connection.connectionId,
        name: participantName,
        stream: subscriber,
        isScreenShare: false,
      });
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

      // 이미 스토어에서 세션이 사라진 경우(정상 종료 과정) redundant 호출 방지
      const currentSession = useMeetingStore.getState().openviduSession;
      if (currentSession) {
        cleanup();
        leaveMeeting();
      }
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
    } = useMeetingStore.getState();

    // 1. 방어막: 이미 진행 중이거나 활성화된 경우 차단
    if (isScreenShareLoading || isScreenSharing || screenPublisher) {
      console.warn('이미 화면 공유가 활성화되어 있거나 처리 중입니다.');
      return { success: false };
    }

    if (!session || !OV) {
      setError('세션이 연결되지 않았습니다.');
      return { success: false };
    }

    setScreenShareLoading(true);

    try {
      // 2. 기존 오디오 전용 Publisher 중단 (있을 경우)
      if (currentPublisher) {
        await session.unpublish(currentPublisher);
        setPublisher(null);
      }

      // 3. 새로운 통합 Publisher 생성 (Screen + Audio)
      const currentMicState = useMeetingStore.getState().isMicOn;
      const newScreenPublisher = await OV.initPublisherAsync(undefined, {
        videoSource: 'screen',
        audioSource: undefined, // 기본 마이크 사용
        publishAudio: currentMicState,
        publishVideo: true,
        mirror: false,
      });

      // 4. 이벤트 리스너 설정 (화면 공유 중지 감지 등)
      newScreenPublisher.once('accessAllowed', () => {
        console.log('화면 공유 권한 허용됨');
      });
      newScreenPublisher.once('accessDenied', () => {
        console.warn('화면 공유 권한 거부됨');
        // 권한 거부 시 오디오 전용으로 복구 시도
        stopScreenShare();
      });

      const handleEnded = () => stopScreenShare();
      newScreenPublisher._endedHandler = handleEnded;
      const tracks = newScreenPublisher.stream?.getMediaStream()?.getVideoTracks();
      if (tracks && tracks[0]) {
        tracks[0].addEventListener('ended', handleEnded);
      }

      // 5. 세션에 게시
      await session.publish(newScreenPublisher);

      // 스토어 업데이트 (통합 퍼블리셔이므로 둘 다 설정)
      setScreenPublisher(newScreenPublisher);
      setPublisher(newScreenPublisher);
      setScreenSharing(true);

      return { success: true };
    } catch (error) {
      console.error('화면 공유 시작 실패:', error);
      await restoreAudioOnlyPublisher();

      // 실패 시 오디오 전용 퍼블리셔 복구 시도
      await restoreAudioOnlyPublisher();
      if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
        setError('화면 공유 권한이 거부되었습니다.');
      } else {
        setError('화면 공유를 시작할 수 없습니다.');
      }
      return { success: false, error };
    } finally {
      setScreenShareLoading(false);
    }
  }, [setScreenSharing, setError, setScreenPublisher, setPublisher, setScreenShareLoading]);

  // ------------------------------------------------------------------
  // 화면 공유 중지 (화면+오디오 Publisher를 오디오 전용 Publisher로 교체)
  // ------------------------------------------------------------------
  const stopScreenShare = useCallback(async () => {
    const {
      openviduSession: session,
      isScreenShareLoading,
      screenPublisher: currentScreenPublisher,
    } = useMeetingStore.getState();

    if (isScreenShareLoading) return;

    setScreenShareLoading(true);

    try {
      // 1. 기존 화면+오디오 Publisher 중단
      if (currentScreenPublisher && session) {
        // 이벤트 리스너 정리
        const track = currentScreenPublisher.stream?.getMediaStream()?.getVideoTracks()[0];
        if (track && currentScreenPublisher._endedHandler) {
          track.removeEventListener('ended', currentScreenPublisher._endedHandler);
        }

        await session.unpublish(currentScreenPublisher);
        setScreenPublisher(null);
        setPublisher(null);
        setScreenSharing(false);
      }

      // 2. 오디오 전용 Publisher로 복구
      await restoreAudioOnlyPublisher();
    } catch (error) {
      console.error('화면 공유 중지 실패:', error);
    } finally {
      setScreenShareLoading(false);
    }
  }, [setScreenSharing, setScreenPublisher, setPublisher, setScreenShareLoading]);

  // ------------------------------------------------------------------
  // 오디오 전용 Publisher 복구 (내부 헬퍼)
  // ------------------------------------------------------------------
  const restoreAudioOnlyPublisher = async () => {
    const { openviduSession: session, openviduInstance: OV, publisher } = useMeetingStore.getState();
    // 이미 publisher가 있으면(복구 불필요) 스킵
    if (publisher || !session || !OV) return;

    try {
      const currentMicState = useMeetingStore.getState().isMicOn;
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
