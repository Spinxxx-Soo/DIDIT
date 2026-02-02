// src/api/project.js
import api from './axios';

export const projectApi = {
  // ------------------------------------------------------------------
  // 프로젝트 관리
  // ------------------------------------------------------------------

  /**
   * 프로젝트 목록 조회
   * @returns {Promise<ProjectResponse[]>}
   */
  getProjects: () => api.get('/api/v1/projects'),

  /**
   * 프로젝트 상세 조회 (Added)
   * @param {number} projectId
   * @returns {Promise<ProjectResponse>}
   */
  getProject: (projectId) => api.get(`/api/v1/projects/${projectId}`),

  /**
   * 최근 조회 프로젝트 목록 (Added)
   * @returns {Promise<ProjectRecentResponse[]>}
   */
  getRecentProjects: () => api.get('/api/v1/projects/recents'),

  /**
   * 프로젝트 생성
   * @param {Object} data - { projectName: string, githubUrl: string }
   * @returns {Promise}
   */
  createProject: (data) => api.post('/api/v1/projects', data),

  /**
   * 프로젝트 GitHub 저장소 업데이트
   * @param {number} projectId
   * @param {string} githubRepo - "organization/repository" 형식
   * @returns {Promise}
   */
  updateProjectRepo: (projectId, githubRepo) =>
    api.patch(`/api/v1/projects/${projectId}`, { githubRepo }),

  /**
   * GitHub 저장소 검증
   * @param {string} repo - "organization/repository" 형식
   * @returns {Promise}
   */
  validateGithubRepo: (repo) => api.get(`/api/v1/github/validate`, { params: { repo } }),

  // ------------------------------------------------------------------
  // 초대 관리
  // ------------------------------------------------------------------

  /**
   * 초대 코드 생성
   * @param {Object} data - { projectId: number, expireDate?: string }
   * @returns {Promise<string>} - UUID 초대 코드
   */
  createInvite: (data) => api.post('/api/v1/projects/invites', data),

  /**
   * 초대 코드로 프로젝트 조회
   * @param {string} inviteCode - UUID
   * @returns {Promise<ProjectResponse>}
   */
  getProjectByInvite: (inviteCode) => api.get(`/api/v1/projects/invites/${inviteCode}`),

  /**
   * 초대 코드로 프로젝트 참여
   * @param {string} inviteCode - UUID
   * @returns {Promise}
   */
  joinByInvite: (inviteCode) => api.post(`/api/v1/projects/invites/${inviteCode}`),

  // ------------------------------------------------------------------
  // 참여자 관리
  // ------------------------------------------------------------------

  /**
   * 프로젝트 참여자 목록 조회
   * @param {number} projectId
   * @returns {Promise<UserResponse[]>}
   */
  getParticipants: (projectId) => api.get(`/api/v1/projects/${projectId}/participants`),

  /**
   * 프로젝트 참여자 추방 (Added)
   * @param {number} projectId
   * @param {number} userId
   * @returns {Promise}
   */
  removeParticipant: (projectId, userId) => api.delete(`/api/v1/projects/${projectId}/participants/${userId}`),

  // ------------------------------------------------------------------
  // 회의 채널 관리
  // ------------------------------------------------------------------

  /**
   * 회의 채널 생성
   * @param {number} projectId
   * @param {Object} data - { title: string, mode: 'chat' | 'voice' }
   * @returns {Promise<number>} - 회의 ID
   */
  createChannel: (projectId, data) => api.post(`/api/v1/projects/${projectId}/add-channel`, data),

  /**
   * 프로젝트 회의 채널 목록 조회
   * @param {number} projectId
   * @param {Object} params - { status?, cursor?, page?, size?, sort? }
   * @returns {Promise<MeetingResponse[]>}
   */
  getChannels: (projectId, params) => api.get(`/api/v1/projects/${projectId}/channels`, { params }),

  /**
   * 회의 채널 상세 조회
   * @param {number} channelId
   * @returns {Promise<MeetingResponse>}
   */
  getChannel: (channelId) => api.get(`/api/v1/channels/${channelId}`),

  /**
   * 회의 채널 수정 (제목, 시간 등)
   * @param {number} channelId
   * @param {Object} params - Query Params: { title?, start?, due? }
   * @returns {Promise}
   */
  updateChannel: (channelId, params) => api.patch(`/api/v1/channels/${channelId}`, null, { params }),

  /**
   * 회의 채널 삭제
   * @param {number} channelId
   * @returns {Promise}
   */
  deleteChannel: (channelId) => api.delete(`/api/v1/channels/${channelId}`),

  // ------------------------------------------------------------------
  // 프로젝트 수정
  // ------------------------------------------------------------------

  /**
   * 프로젝트 저장소 업데이트
   * @param {number} projectId
   * @param {string} repoFullName - organization/repository 형식
   * @returns {Promise}
   */
  updateProjectRepo: (projectId, repoFullName) =>
    api.patch(`/api/v1/projects/${projectId}`, { githubUrl: repoFullName }),

  /**
   * 프로젝트 이름 수정
   * @param {number} projectId
   * @param {string} name - 새 프로젝트 이름
   * @returns {Promise}
   */
  updateProjectName: (projectId, name) =>
    api.patch(`/api/v1/projects/${projectId}`, { projectName: name }),

  /**
 * 프로젝트 삭제 (팀장이 혼자일 때)
 * @param {number} projectId
 * @returns {Promise}
 */
  deleteProject: (projectId) =>
    api.delete(`/api/v1/projects/${projectId}`),

  /**
   * 프로젝트 떠나기
   * @param {number} projectId
   * @returns {Promise}
   */
  leaveProject: (projectId) =>
    api.delete(`/api/v1/projects/${projectId}/leave`),

  /**
   * 팀장 위임
   * @param {number} projectId
   * @param {number} newOwnerId - 새 팀장 유저 ID
   * @returns {Promise}
   */
  transferOwnership: (projectId, newOwnerId) =>
    api.patch(`/api/v1/projects/${projectId}/owner`, { newOwnerId }),
};
