import { create } from 'zustand';
import { issueApi } from '@/api/features';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || true; // 강제 Mock

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
  fetchIssues: async (roomId) => {
    set({ isLoading: true });

    if (IS_MOCK) {
      await new Promise(r => setTimeout(r, 500));
      // 기존 임시 데이터 부활
      const MOCK_ISSUES = [
        { id: 101, title: '[Mock] 로그인 화면 수정', body: '테스트 이슈입니다', status: 'open', priority: 'high', assignees: ['나'] },
        { id: 102, title: '[Mock] API 연결 테스트', body: 'Mock 모드입니다', status: 'open', priority: 'medium', assignees: [] },
      ];
      set({ issues: MOCK_ISSUES, isLoading: false });
      return;
    }

    try {
      const response = await issueApi.getIssues(roomId);
      set({ issues: response.data, isLoading: false });
    } catch (error) {
      console.error('이슈 목록 조회 실패:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  addIssue: async (roomId, issueData) => {
    if (IS_MOCK) {
      await new Promise(r => setTimeout(r, 500));
      const newIssue = {
        id: Date.now(),
        ...issueData,
        assignees: [],
        status: 'open',
        priority: 'medium'
      };
      set((state) => ({
        issues: [newIssue, ...state.issues],
        activePanel: 'issue',
        selectedIssueId: null
      }));
      return newIssue;
    }

    try {
      const response = await issueApi.createIssue(roomId, issueData);
      set((state) => ({
        issues: [response.data, ...state.issues],
        activePanel: 'issue',
        selectedIssueId: null
      }));
      return response.data;
    } catch (error) {
      console.error('이슈 생성 실패:', error);
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