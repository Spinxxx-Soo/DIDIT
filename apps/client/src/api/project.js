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
   * 프로젝트 생성
   * @param {Object} data - { projectName: string, githubUrl: string }
   * @returns {Promise}
   */
  createProject: (data) => api.post('/api/v1/projects', data),

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

  // ------------------------------------------------------------------
  // 회의 채널 관리
  // ------------------------------------------------------------------

  /**
   * 회의 채널 생성
   * @param {number} projectId
   * @param {Object} data - { title: string, mode: 'CHAT' | 'VOICE' }
   * @returns {Promise<number>} - 회의 ID
   */
  createChannel: (projectId, data) => api.post(`/api/v1/projects/${projectId}/add-channel`, data),

  /**
   * 프로젝트 회의 채널 목록 조회 (페이지네이션)
   * @param {number} projectId
   * @param {Object} params - { status?: 'SCHEDULED'|'RUNNING'|'ENDED', cursor?: number, page?: number, size?: number, sort?: string }
   * @returns {Promise<MeetingResponse[]>}
   */
  getChannels: (projectId, params) => api.get(`/api/v1/projects/${projectId}/channels`, { params }),
};
