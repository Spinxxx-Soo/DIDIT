// src/api/meeting.js
import api from './axios';

export const meetingApi = {
  // --- [회의록/리스트] ---
  // 회의록 리스트 불러오기
  getMeetings: (projectId, params) =>
    api.get(`/api/v1/projects/${projectId}/meetings`, { params }), // { status, cursor, size }

  // 최근 회의록 3개
  getRecentMeetings: (projectId) => api.get(`/api/v1/projects/${projectId}/meetings/recent`),

  // 전체 회의록 검색
  searchMeetings: (projectId, params) =>
    api.get(`/api/v1/projects/${projectId}/meetings/search`, { params }), // { q, cursor, size }

  // --- [실시간 세션 관리] ---
  // 회의실 생성 (세션 시작)
  createSession: (projectId, data) => api.post(`/api/v1/projects/${projectId}/sessions`, data),

  // 회의실 삭제
  deleteSession: (projectId, sessionId) => api.delete(`/api/v1/projects/${projectId}/sessions/${sessionId}`),

  // 회의실 이름 수정
  updateSession: (projectId, sessionId, data) => api.patch(`/api/v1/projects/${projectId}/sessions/${sessionId}`, data),

  // 회의실 나가기
  leaveSession: (meetingId) => api.delete(`/api/v1/meetings/${meetingId}/leave`),

  // --- [OpenVidu / 미디어] ---
  // 음성 대화 참가 (토큰 발급)
  joinVoice: (projectId, data) => api.post(`/api/v1/projects/${projectId}/meetings/join`, data),

  // 화면 공유 상태 갱신
  updateScreenShare: (meetingId, data) => api.put(`/api/v1/meetings/${meetingId}/screen`, data),

  // --- [AI 요약 및 녹음] ---
  // 회의 녹음 시작
  startRecording: (meetingId) => api.post(`/api/v1/meetings/${meetingId}/record/start`),

  // 회의 녹음 종료
  stopRecording: (meetingId) => api.post(`/api/v1/meetings/${meetingId}/record/stop`),

  // 회의록 생성 (요약 트리거)
  createSummary: (meetingId, data) => api.post(`/api/v1/meetings/${meetingId}/summary`, data),

  // 요약 Job 상태 조회
  getSummaryJobStatus: (jobId) => api.get(`/api/v1/ai/jobs/${jobId}`),
};
