import api from './axios';

export const issueApi = {
  // --- [이슈] ---
  // 진행중인 이슈 5개 불러오기
  getActiveIssues: (roomId) => api.get(`/api/v1/rooms/${roomId}/issues/active`),

  // 이슈 생성
  createIssue: (roomId, data) => api.post(`/api/v1/rooms/${roomId}/issues`, data),

  // 이슈 목록/검색 (권장)
  getIssues: (roomId, params) => api.get(`/api/v1/rooms/${roomId}/issues`, { params }),

  // --- [캘린더] ---
  // 캘린더 생성 (예약)
  createCalendar: (roomId, data) => api.post(`/api/v1/rooms/${roomId}/calendar`, data),

  // 캘린더 수정
  updateCalendar: (calendarId, data) => api.patch(`/api/v1/calendar/${calendarId}`, data),

  // 캘린더 삭제
  deleteCalendar: (calendarId) => api.delete(`/api/v1/calendar/${calendarId}`),
};

// src/api/chat.js
export const chatApi = {
  // 텍스트 채팅 불러오기
  getChats: (roomId, params) => api.get(`/api/v1/rooms/${roomId}/chats`, { params }),
  
  // 채팅 수정
  updateChat: (chatId, data) => api.patch(`/api/v1/chats/${chatId}`, data),
  
  // 채팅 삭제
  deleteChat: (chatId) => api.delete(`/api/v1/chats/${chatId}`),
};