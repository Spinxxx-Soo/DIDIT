// src/api/meeting.js
import api from './axios';

export const meetingApi = {
  // src/api/meeting.js
  bookMeeting: (projectId, data) => {
    return api.post(`/api/v1/projects/${projectId}/book-channel`, {
      title: data.title,
      start: data.start,
      end: data.end
    });
  },

  // 2. 날짜별 회의 목록 조회 (GET 요청)
  getMeetingsByDate: (projectId, start, end) => {
    return api.get(`/api/v1/projects/${projectId}/channels/date`, {
      params: {
        start: start,
        end: end
      }
    });
  },

  // [Refactor Notice] 'Meetings' 용어는 문서상 'Channels'로 통일되어 있습니다.
  // 목록 조회 등은 projectApi.getChannels를 사용해야 합니다.

  // --- [회의록/리스트] ---
  // [Disabled] 문서에 'meetings' 엔드포인트 없음. projectApi.getChannels 사용 권장.
  // 회의록 리스트 불러오기
  // getMeetings: (projectId, params) =>
  //   api.get(`/api/v1/projects/${projectId}/meetings`, { params }),

  // [Disabled] 문서에 없음
  // 최근 회의록 3개
  // getRecentMeetings: (projectId) => api.get(`/api/v1/projects/${projectId}/meetings/recent`),

  // [Disabled] 문서에 없음
  // 전체 회의록 검색
  // searchMeetings: (projectId, params) =>
  //   api.get(`/api/v1/projects/${projectId}/meetings/search`, { params }),

  // --- [실시간 세션 관리] ---
  // [Disabled] 문서에 실시간 세션 생성/관리 API 없음
  // 회의실 생성 (세션 시작)
  // createSession: (projectId, data) => api.post(`/api/v1/projects/${projectId}/sessions`, data),

  // 회의실 삭제 (DELETE /channels/{id} 와 중복 가능성 있으나, 주소 다름)
  // deleteSession: (projectId, sessionId) => api.delete(`/api/v1/projects/${projectId}/sessions/${sessionId}`),

  // 회의실 이름 수정 (PATCH /channels/{id} 와 중복 가능성)
  // updateSession: (projectId, sessionId, data) => api.patch(`/api/v1/projects/${projectId}/sessions/${sessionId}`, data),

  // 회의실 나가기
  // leaveSession: (meetingId) => api.delete(`/api/v1/meetings/${meetingId}/leave`),

  // --- [WebRTC 음성 회의] ---

  /**
   * 음성 회의 참가 (WebRTC 연결 생성)
   * @param {number} channelId
   * @returns {Promise<string>} - 연결 토큰
   */
  joinWebRTC: (channelId) =>
    api.post(`/api/v1/channels/${channelId}/webrtc`),

  /**
   * 음성 회의 나가기 (WebRTC 연결 종료)
   * @param {number} channelId
   * @returns {Promise}
   */
  leaveWebRTC: (channelId) =>
    api.delete(`/api/v1/channels/${channelId}/webrtc`),

  /**
   * 음성 회의 참가자 목록 조회
   * @param {number} channelId
   * @returns {Promise<UserResponse[]>}
   */
  getWebRTCUsers: (channelId) =>
    api.get(`/api/v1/channels/${channelId}/webrtc/users`),

  // --- [AI 요약 및 녹음] ---
  // 회의 녹음 시작 (Mock)
  startRecording: (meetingId) => {
    console.log(`[Mock] Recording started for meeting ${meetingId}`);
    return Promise.resolve({ data: { status: 'RECORDING_STARTED' } });
  },

  // 회의 녹음 종료 (Mock)
  stopRecording: (meetingId) => {
    console.log(`[Mock] Recording stopped for meeting ${meetingId}`);
    return Promise.resolve({ data: { status: 'RECORDING_STOPPED' } });
  },

  // 회의 요약 생성 요청 (Mock)
  createSummary: (meetingId) => {
    console.log(`[Mock] Creating summary for meeting ${meetingId}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            summaryId: `summary_${Date.now()}`,
            title: '주간 업무 보고 및 이슈 공유',
            date: new Date().toISOString(),
            content: [
              '백엔드 API 연동 일정 조율 필요',
              '프론트엔드 UI 컴포넌트 라이브러리 선정 완료',
              '다음 주 월요일 데모 시연 준비',
            ],
            actionItems: [
              { id: 1, text: 'API 명세서 업데이트 (담당: 김철수)', checked: false },
              { id: 2, text: '로그인 페이지 퍼블리싱 (담당: 이영희)', checked: true },
            ],
          },
        });
      }, 3000); // 3초 딜레이로 생성 시뮬레이션
    });
  },

  // 프로젝트별 회의록 리스트 조회 (Mock)
  getMeetingSummaries: (projectId) => {
    return Promise.resolve({
      data: [
        {
          id: 1,
          title: '1주차 스프린트 계획 회의',
          date: '2026-01-20T10:00:00',
          summaryPreview: '스프린트 목표 설정 및 업무 분배...',
        },
        {
          id: 2,
          title: 'FE/BE 인터페이스 협의',
          date: '2026-01-22T14:00:00',
          summaryPreview: 'API 앤드포인트 명명 규칙 확정...',
        },
        {
          id: 3,
          title: '중간 점검 회의',
          date: '2026-01-25T11:00:00',
          summaryPreview: '현재 진행 상황 공유 및 블로커 해결...',
        },
      ],
    });
  },

  // 특정 회의록 상세 조회 (Mock)
  getMeetingSummaryDetail: (summaryId) => {
    return Promise.resolve({
      data: {
        id: summaryId,
        title: '상세 회의록 예시',
        date: new Date().toISOString(),
        content: [
          '주요 안건 논의 완료',
          '다음 일정 확정',
        ],
        actionItems: [
          { id: 1, text: '회의록 공유하기', checked: false },
        ],
      },
    });
  },
  // 회의록 수정 (Mock)
  updateMeetingSummary: (summaryId, data) => {
    console.log(`[Mock] Updating summary ${summaryId}`, data);
    return Promise.resolve({
      data: {
        id: summaryId,
        ...data,
      },
    });
  },
};
