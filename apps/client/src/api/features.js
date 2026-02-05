import api from './axios';



export const chatApi = {
  // 텍스트 채팅 불러오기
  getChats: (channelId, params) => api.get(`/api/v1/channels/${channelId}/chats`, { params }),

  // 채팅 수정
  updateChat: (chatId, data) => api.patch(`/api/v1/channels/chats/${chatId}`, data),

  // 채팅 삭제
  deleteChat: (chatId) => api.delete(`/api/v1/channels/chats/${chatId}`),

  // 채팅 전송
  createChat: (channelId, data) => api.post(`/api/v1/channels/${channelId}/chats`, data),
};