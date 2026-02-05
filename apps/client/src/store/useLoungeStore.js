import { create } from 'zustand';
import { loungeApi } from '@/api/lounge';

// 환경변수로 Mock 모드 전환 (.env에서 VITE_USE_MOCK=true/false)
const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// API 응답 정규화 함수
const normalizeIssue = (issue) => ({
  id: issue.id,
  issueNo: issue.issueNo,
  title: issue.title,
  body: issue.body || '',
  status: issue.status?.toLowerCase() || 'open',
  priority: issue.priority?.toLowerCase() || 'medium',
  assignees: issue.assignees?.map((a) => {
    if (typeof a === 'string') return a;
    return a.name || a.nickname;
  }).filter(Boolean) || [],
  author: issue.author?.name || issue.author?.nickname || '',
  createdAt: issue.createdAt,
  updatedAt: issue.updatedAt,
});

// Mock 데이터 (API 응답 구조와 동일)
const MOCK_ISSUES = [
  {
    id: 101,
    issueNo: 143,
    title: '로그인 버그 수정',
    body: '로그인 시 토큰이 제대로 저장되지 않는 문제',
    status: 'OPEN',
    priority: 'HIGH',
    assignees: [{ name: '김도연' }],
    author: { name: '홍길동' },
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
  },
  {
    id: 102,
    issueNo: 142,
    title: 'UI 컴포넌트 리팩토링',
    body: 'Button 컴포넌트 공통화 작업',
    status: 'OPEN',
    priority: 'MEDIUM',
    assignees: [{ name: '이다연' }],
    author: { name: '김철수' },
    createdAt: '2025-01-19T09:00:00Z',
    updatedAt: '2025-01-19T09:00:00Z',
  },
  {
    id: 103,
    issueNo: 141,
    title: '문서 업데이트',
    body: 'README 파일 업데이트',
    status: 'CLOSED',
    priority: 'LOW',
    assignees: [{ name: '하지연' }],
    author: { name: '박영희' },
    createdAt: '2025-01-18T14:00:00Z',
    updatedAt: '2025-01-18T16:00:00Z',
  },
  {
    id: 104,
    issueNo: 140,
    title: '결제 모듈 연동 실패',
    body: 'PG사 API 연동 시 타임아웃 발생',
    status: 'OPEN',
    priority: 'HIGH',
    assignees: [{ name: '홍수민' }],
    author: { name: '이민수' },
    createdAt: '2025-01-17T11:00:00Z',
    updatedAt: '2025-01-17T11:00:00Z',
  },
  {
    id: 105,
    issueNo: 139,
    title: '메인 페이지 배너 교체',
    body: '신규 프로모션 배너로 교체 필요',
    status: 'OPEN',
    priority: 'MEDIUM',
    assignees: [{ name: '김이' }],
    author: { name: '최지우' },
    createdAt: '2025-01-16T15:00:00Z',
    updatedAt: '2025-01-16T15:00:00Z',
  },
  {
    id: 106,
    issueNo: 138,
    title: 'API 응답 최적화',
    body: '응답 시간 개선을 위한 쿼리 최적화',
    status: 'CLOSED',
    priority: 'LOW',
    assignees: [{ name: '손을준' }],
    author: { name: '정민호' },
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T18:00:00Z',
  },
  {
    id: 107,
    issueNo: 137,
    title: '보안 취약점 패치',
    body: 'XSS 취약점 수정',
    status: 'OPEN',
    priority: 'HIGH',
    assignees: [{ name: '이강인' }],
    author: { name: '김보안' },
    createdAt: '2025-01-14T09:00:00Z',
    updatedAt: '2025-01-14T09:00:00Z',
  },
];

const useLoungeStore = create((set, get) => ({
  // 패널 관련 상태
  activePanel: null,
  selectedIssueId: null,

  // 이슈 데이터
  issues: [],
  isLoading: false,
  error: null,

  // 패널 제어
  setActivePanel: (panel) => set({ activePanel: panel }),

  resetToIssueList: () => set({
    activePanel: 'issue',
    selectedIssueId: null
  }),

  openIssueDetail: (issueId) => set({
    activePanel: 'issue_detail',
    selectedIssueId: issueId
  }),

  openCreateIssue: () => set({
    activePanel: 'issue_detail',
    selectedIssueId: null
  }),

  closeSidebar: () => set({
    activePanel: null,
    selectedIssueId: null
  }),

  // 이슈 트래커 패널 열기
  openIssueMode: () => set({
    activePanel: 'issue',
    selectedIssueId: null
  }),

  // 이슈 CRUD
  fetchIssues: async (projectId) => {
    set({ isLoading: true, error: null });

    if (IS_MOCK) {
      await new Promise((r) => setTimeout(r, 500));
      const normalizedIssues = MOCK_ISSUES.map(normalizeIssue);
      set({ issues: normalizedIssues, isLoading: false });
      return;
    }

    try {
      // TODO: API 완성 후 features.js에서 getIssues 주석 해제 (Deprecated -> loungeApi 사용)
      const response = await loungeApi.getIssues(projectId);
      const data = response?.data;
      const issueList = Array.isArray(data) ? data : [];
      const normalizedIssues = issueList.map(normalizeIssue);
      set({ issues: normalizedIssues, isLoading: false });
    } catch (error) {
      console.error('이슈 목록 조회 실패:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // 1단계: 이슈 분석 (저장하지 않음)
  analyzeIssueContent: async (projectId, issueData) => {
    set({ isLoading: true, error: null });

    // API expects: { title, body, status, assigneeIds }
    // User Input: { title, body, issueStatus (or status), assigneeIds }
    const status = (issueData.status || issueData.issueStatus || 'OPEN').toUpperCase();

    if (IS_MOCK) {
      await new Promise((r) => setTimeout(r, 1000));
      // Mock 분석 결과
      return {
        issueId: Date.now(),
        priority: 'HIGH', // Mock Result
        status: status
      };
    }

    try {
      const analyzePayload = {
        title: issueData.title,
        body: issueData.body,
        status: status, // Matches AnalyzeIssueRequest.java
        assigneeIds: issueData.assigneeIds
      };

      const analyzeRes = await loungeApi.analyzeIssue(projectId, analyzePayload);
      const analyzedIssue = analyzeRes.data;

      if (!analyzedIssue || !analyzedIssue.issueId) {
        throw new Error('이슈 분석 단계에서 ID를 반환하지 않았습니다.');
      }

      set({ isLoading: false });
      return analyzedIssue; // { issueId, priority, status ... }
    } catch (error) {
      console.error('이슈 분석 실패:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // 2단계: 이슈 실제 등록
  registerIssue: async (projectId, issueData) => {
    set({ isLoading: true, error: null });

    if (IS_MOCK) {
      await new Promise((r) => setTimeout(r, 500));

      // Mock: Use provided issueId or fallback
      const finalIssueId = issueData.issueId || Date.now();

      const newIssue = {
        id: finalIssueId,
        issueNo: finalIssueId % 1000,
        title: issueData.title,
        body: issueData.body,
        status: (issueData.issueStatus || 'OPEN').toUpperCase(),
        priority: (issueData.issuePriority || 'MEDIUM').toUpperCase(),
        assignees: issueData.assignees || [], // Mock expects names/strings for UI display immediately
        author: { name: 'CurrentUser' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mock Normalization (to match UI structure)
      const normalizedMock = normalizeIssue(newIssue);

      set((state) => ({
        issues: [normalizedMock, ...state.issues],
        activePanel: 'issue',
        selectedIssueId: null,
        isLoading: false,
      }));
      return normalizedMock;
    }

    try {
      // API expects: { orgName, repoName, issueId, issueStatus, issuePriority, title, body, assigneeIds }
      // Ensure Enums are UpperCase
      const createPayload = {
        orgName: issueData.orgName,
        repoName: issueData.repoName,
        issueId: issueData.issueId,
        issueStatus: (issueData.issueStatus || 'OPEN').toUpperCase(),
        issuePriority: (issueData.issuePriority || 'MEDIUM').toUpperCase(),
        title: issueData.title,
        body: issueData.body,
        assigneeIds: issueData.assigneeIds
      };

      const response = await loungeApi.createIssue(projectId, createPayload);

      // 백엔드 Stream/List 응답 처리
      const resultData = Array.isArray(response.data) ? response.data[0] : response.data;
      const normalizedIssue = normalizeIssue(resultData);

      set((state) => ({
        issues: [normalizedIssue, ...state.issues],
        activePanel: 'issue',
        selectedIssueId: null,
        isLoading: false,
      }));
      return normalizedIssue;
    } catch (error) {
      console.error('이슈 생성 실패:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateIssue: (issueId, updatedData) => {
    // 실제 API 연동은 생략하고 Optimistic UI만 적용하거나 추후 구현
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.id === issueId ? { ...issue, ...updatedData } : issue
      ),
    }));
  },

  deleteIssue: (issueId) => {
    set((state) => ({
      issues: state.issues.filter((issue) => issue.id !== issueId),
      activePanel: 'issue',
      selectedIssueId: null,
    }));
  },

  getIssueById: (issueId) => {
    return get().issues.find((issue) => issue.id === issueId);
  },
}));

export default useLoungeStore;