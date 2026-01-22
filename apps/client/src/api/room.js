import api from './axios';

export const roomApi = {
  // 내 방 목록 확인
  getMyRooms: (params) => api.get('/api/v1/rooms', { params }), // params: { cursor, size }
  
  // 방 생성 (팀장)
  createRoom: (data) => api.post('/api/v1/rooms', data), // data: { name, thumbnailUrl }

  // --- [방 내부 기능] ---
  // 참여자 목록 불러오기
  getParticipants: (roomId) => api.get(`/api/v1/rooms/${roomId}/participants`),

  // 방 탈퇴
  leaveRoom: (roomId) => api.delete(`/api/v1/rooms/${roomId}/leave`),

  // 주간 활동 요약 (통계)
  getWeeklyStats: (roomId, week) => 
    api.get(`/api/v1/rooms/${roomId}/stats/weekly`, { params: { week } }),

  
  // --- [팀장/관리자 기능] ---
  // 프로젝트 불러오기 (GitHub 레포)
  getRepos: (params) => api.get('/api/v1/repos', { params }), // { org, q }

  // 위임자 선정
  assignAdmin: (roomId, data) => api.patch(`/api/v1/rooms/${roomId}/assign`, data),

  // 팀원 삭제
  removeMember: (roomId, userId) => api.delete(`/api/v1/rooms/${roomId}/members/${userId}`),

  // 초대 링크 생성
  createInvite: (roomId, data) => api.post(`/api/v1/rooms/${roomId}/invites`, data),

  // 초대 링크로 팀원 추가 (참가)
  joinRoom: (inviteCode) => api.post(`/api/v1/rooms/join/${inviteCode}`),
};