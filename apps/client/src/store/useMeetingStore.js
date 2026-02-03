import { create } from 'zustand';
import { meetingApi } from '@/api/meeting';

const useMeetingStore = create((set, get) => ({
  // 회의 상태
  isInMeeting: false,
  meetingId: null,
  sessionId: null,
  openviduUrl: null,
  token: null,
  meetingTitle: '',

  // 현재 선택된 채널 정보
  currentChannelId: null,
  currentChannelName: '',
  currentChannelMode: null, // 'VOICE' | 'CHAT' | null

  // 미디어 상태
  isMicOn: false,
  isSpeakerOn: true,
  isScreenSharing: false,
  isScreenShareLoading: false, // 화면 공유 상태 전환 중인지 여부
  isRecording: false,

  // 참가자 목록
  participants: [],

  // 화면 공유 스트림
  screenShareStream: null,
  screenShareUser: null,

  // 로딩/에러 상태
  isLoading: false,
  error: null,

  // OpenVidu 세션 관련 (전역 공유)
  openviduSession: null,
  openviduInstance: null,
  publisher: null,
  screenPublisher: null,

  // ------------------------------------------------------------------
  // 회의 참가/퇴장
  // ------------------------------------------------------------------
  joinMeeting: (data) => {
    set({
      isInMeeting: true,
      meetingId: data.meetingId,
      sessionId: data.sessionId,
      openviduUrl: data.openviduUrl,
      token: data.token,
      meetingTitle: data.title || '',
      error: null,
    });
  },

  leaveMeeting: async () => {
    // 1. 현재 스토어의 상태값
    const { openviduSession, publisher, screenPublisher, currentChannelId} = get();
    // 2. 실제 OpenVidu 서버, 미디어 장치 종료
    if (openviduSession) {
      try {
        openviduSession.disconnect();
        console.log("OpenVidu 세션 연결 종료 성공");
      } catch (e) {
        console.error("세션 종료 중 오류 발생:", e);
      }
    }

    // 2. 미디어 트랙 종료
    [publisher, screenPublisher].forEach(p => {
        if (p) p.stream.getMediaStream().getTracks().forEach(track => track.stop());
      });

    // 3. [Backend] 백엔드에 나갔음을 알림
    if (currentChannelId) {
      try {
        await meetingApi.leaveWebRTC(currentChannelId);
        console.log("백엔드 세션 종료 처리 완료");
      } catch (e) {
        console.error("Backend leaveWebRTC error:", e);
      }
    }

    set({
      isInMeeting: false,
      meetingId: null,
      sessionId: null,
      openviduUrl: null,
      token: null,
      meetingTitle: '',
      currentChannelId: null,
      currentChannelName: '',
      currentChannelMode: null,
      isMicOn: false,
      isSpeakerOn: true,
      isScreenSharing: false,
      isRecording: false,
      participants: [],
      screenShareStream: null,
      screenShareUser: null,
      // OpenVidu 세션 정리
      openviduSession: null,
      openviduInstance: null,
      publisher: null,
      screenPublisher: null,
    });
  },

  // ------------------------------------------------------------------
  // 채널 선택
  // ------------------------------------------------------------------
  setCurrentChannel: (channelId, channelName, sessionId, mode) => {
    set({
      currentChannelId: channelId,
      currentChannelName: channelName,
      sessionId: sessionId,
      meetingTitle: channelName,
      currentChannelMode: mode,
    });
  },

  // ------------------------------------------------------------------
  // 미디어 토글
  // NOTE: toggleMic/toggleSpeaker 미사용 - useOpenVidu.js의 함수 사용
  // 스토어 함수는 상태만 변경, useOpenVidu 함수는 상태 + OpenVidu 스트림 제어
  // 향후 필요시 활성화
  // ------------------------------------------------------------------
  // toggleMic: () => {
  //   set((state) => ({ isMicOn: !state.isMicOn }));
  // },

  setMicOn: (value) => {
    set({ isMicOn: value });
  },

  // toggleSpeaker: () => {
  //   set((state) => ({ isSpeakerOn: !state.isSpeakerOn }));
  // },

  setSpeakerOn: (value) => {
    set({ isSpeakerOn: value });
  },

  // ------------------------------------------------------------------
  // 화면 공유
  // ------------------------------------------------------------------
  setScreenSharing: (isSharing) => {
    set({ isScreenSharing: isSharing });
  },

  setScreenShareLoading: (isLoading) => {
    set({ isScreenShareLoading: isLoading });
  },

  setScreenShareStream: (stream, userName) => {
    set({
      screenShareStream: stream,
      screenShareUser: userName,
    });
  },

  clearScreenShare: () => {
    set({
      screenShareStream: null,
      screenShareUser: null,
      isScreenSharing: false,
    });
  },

  // ------------------------------------------------------------------
  // 녹음
  // ------------------------------------------------------------------
  setRecording: (isRecording) => {
    set({ isRecording });
  },

  // ------------------------------------------------------------------
  // 참가자 관리
  // ------------------------------------------------------------------
  addParticipant: (participant) => {
    set((state) => ({
      participants: [...state.participants, participant],
    }));
  },

  removeParticipant: (participantId) => {
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== participantId),
    }));
  },

  updateParticipant: (participantId, updates) => {
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === participantId ? { ...p, ...updates } : p
      ),
    }));
  },

  setParticipants: (participants) => {
    set({ participants });
  },

  // ------------------------------------------------------------------
  // 로딩/에러
  // ------------------------------------------------------------------
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  // ------------------------------------------------------------------
  // OpenVidu 세션 관리 (전역 공유용)
  // ------------------------------------------------------------------
  setOpenViduSession: (session) => {
    set({ openviduSession: session });
  },

  setOpenViduInstance: (instance) => {
    set({ openviduInstance: instance });
  },

  setPublisher: (publisher) => {
    set({ publisher });
  },

  setScreenPublisher: (screenPublisher) => {
    set({ screenPublisher });
  },
}));

export default useMeetingStore;
