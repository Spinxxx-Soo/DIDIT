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
  /**
   * 회의 녹음 시작
   * @param {number} channelId
   * @returns {Promise<number>} recording id
   */
  startRecording: (channelId) =>
    api.post(`/api/v1/channels/${channelId}/recording/start`),

  /**
   * 회의 녹음 종료
   * @param {number} channelId
   * @param {number} recordId
   * @returns {Promise}
   */
  stopRecording: (channelId, recordId) =>
    api.post(`/api/v1/channels/${channelId}/recording/stop/${recordId}`),

  // --- [회의 요약(회의록)] ---

  /**
   * 프로젝트 회의록 목록 조회
   * @param {number} projectId
   * @returns {Promise<MeetingSummaryResponse[]>}
   */
  getMeetingSummaries: (projectId, params) =>
    api.get(`/api/v1/projects/${projectId}/summary`, { params }),

  /**
   * 회의록 수정 (프로젝트 멤버만)
   * @param {number} projectId
   * @param {number} summaryId
   * @param {object} data - { title?, summary? }
   * @returns {Promise}
   */
  updateMeetingSummary: (projectId, summaryId, data) =>
    api.patch(`/api/v1/projects/${projectId}/summary/${summaryId}`, data),

  /**
   * 회의록 삭제 (프로젝트 관리자만)
   * @param {number} projectId
   * @param {number} summaryId
   * @returns {Promise}
   */
  deleteMeetingSummary: (projectId, summaryId) =>
    api.delete(`/api/v1/projects/${projectId}/summary/${summaryId}`),
};
