import api from './axios';

/**
 * Lounge (Dashboard) API
 * - Mock endpoints used where backend implementation is pending
 */

export const loungeApi = {

    /**
     * 대시보드 통계 카드 데이터 조회 (Mock)
     */
    getDashboardStats: (projectId) => {
        return Promise.resolve({
            data: {
                completed: 12,
                inProgress: 5,
                deadline: 3,
                meetings: 2
            }
        });
    },

    /**
     * 전체 이슈 목록 조회
     * @param {number} projectId
     * @returns {Promise<IssueResponse[]>}
     */
    getIssues: (projectId) => api.get(`/api/v1/projects/${projectId}/issues`),

    /**
     * 활성(OPEN) 이슈 목록 조회
     * @param {number} projectId
     * @returns {Promise<IssueResponse[]>}
     */
    getActiveIssues: (projectId) => api.get(`/api/v1/projects/${projectId}/issues/active`),

    /**
     * 이슈 생성
     * @param {number} projectId
     * @param {Object} data - { orgName, repoName, title, body, assigneeIds, issueId, issuePriority }
     */
    createIssue: (projectId, data) => api.post(`/api/v1/projects/${projectId}/issues`, data),

    /**
     * 이슈 우선순위 분석
     * @param {number} projectId
     * @param {Object} data - { title, status, body, assigneeIds }
     */
    analyzeIssue: (projectId, data) => api.post(`/api/v1/projects/${projectId}/issue/analyze`, data),

    /**
     * 이슈 수정
     * @param {number} projectId
     * @param {number} issueId
     * @param {Object} data - { title, body, status, priority, assigneeIds }
     */
    updateIssue: (projectId, issueId, data) => api.patch(`/api/v1/projects/${projectId}/issues/${issueId}`, data),

    /**
     * 이슈 삭제
     * @param {number} projectId
     * @param {number} issueId
     */
    deleteIssue: (projectId, issueId) => api.delete(`/api/v1/projects/${projectId}/issues/${issueId}`),

    /**
     * 최근 회의록 조회 (최대 4개)
     * @param {number} projectId
     */
    getRecentMinutes: (projectId) => api.get(`/api/v1/projects/${projectId}/summary`),
};
