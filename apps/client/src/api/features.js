import api from './axios';

export const issueApi = {
  // --- [이슈] ---
  // 진행중인 이슈 5개 불러오기 (Refactored: /rooms/ -> /projects/)
  getActiveIssues: (projectId) => api.get(`/api/v1/projects/${projectId}/issues/active`),

  // [Disabled] 문서에 이슈 생성 API 없음
  // 이슈 생성
  // createIssue: (projectId, data) => api.post(`/api/v1/projects/${projectId}/issues`, data),

  // [Disabled] 문서에 전체 이슈 조회 API 없음
  // 이슈 목록/검색 (권장)
  // getIssues: (projectId, params) => api.get(`/api/v1/projects/${projectId}/issues`, { params }),

  // --- [캘린더] ---
  // [Disabled] 문서에 캘린더 API 없음
  // 캘린더 생성 (예약)
  // createCalendar: (projectId, data) => api.post(`/api/v1/rooms/${projectId}/calendar`, data),

  // 캘린더 수정
  // updateCalendar: (calendarId, data) => api.patch(`/api/v1/calendar/${calendarId}`, data),

  // 캘린더 삭제
  // deleteCalendar: (calendarId) => api.delete(`/api/v1/calendar/${calendarId}`),
};

// [Disabled] 문서에 채팅 API 없음
// src/api/chat.js
export const chatApi = {
  // 텍스트 채팅 불러오기
  getChats: (projectId, params) => api.get(`/api/v1/rooms/${projectId}/chats`, { params }),

  // 채팅 수정
  updateChat: (chatId, data) => api.patch(`/api/v1/chats/${chatId}`, data),

  // 채팅 삭제
  deleteChat: (chatId) => api.delete(`/api/v1/chats/${chatId}`),

  // 채팅 전송
  createChat: (projectId, data) => api.post(`/api/v1/rooms/${projectId}/chats`, data),
};