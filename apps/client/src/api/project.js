// src/api/project.js
import api from './axios';

export const projectApi = {
  /**
   * 프로젝트 목록 조회
   * @returns {Promise}
   */
  getProjects: () => api.get('/api/projects'),

  /**
   * 프로젝트 상세 조회
   * @param {number} projectId
   * @returns {Promise}
   */
  getProject: (projectId) => api.get(`/api/projects/${projectId}`),

  /**
   * 프로젝트 생성
   * @param {FormData} formData - name, image(optional), githubRepo(optional)
   * @returns {Promise}
   */
  createProject: (formData) => api.post('/api/projects', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  /**
   * 프로젝트 이름 중복 체크
   * @param {string} name
   * @returns {Promise<{isDuplicate: boolean}>}
   */
  checkNameDuplicate: (name) => api.get('/api/projects/check-name', {
    params: { name },
  }),

  /**
   * GitHub 저장소 검증
   * @param {string} repo - "organization/repository" 형식
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  validateGithubRepo: (repo) => api.post('/api/projects/validate-repo', { repo }),

  /**
   * 프로젝트 수정
   * @param {number} projectId
   * @param {FormData} formData
   * @returns {Promise}
   */
  updateProject: (projectId, formData) => api.patch(`/api/projects/${projectId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  /**
   * 프로젝트 삭제
   * @param {number} projectId
   * @returns {Promise}
   */
  deleteProject: (projectId) => api.delete(`/api/projects/${projectId}`),
};
