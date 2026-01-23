import { create } from 'zustand';

// 임시 초기 데이터
const INITIAL_ISSUES = [
  { 
    id: 23, 
    title: '로그인 페이지 CSS 깨짐 현상', 
    body: '반응형 적용 시 모바일 화면에서 레이아웃이 깨지는 문제가 발생합니다.\n\n재현 방법:\n1. 모바일 화면(360px)으로 접속\n2. 로그인 페이지 확인\n3. 입력 필드가 화면 밖으로 벗어남',
    status: 'open', 
    priority: 'high',
    assignees: ['하지연', '김도연']
  },
  { 
    id: 22, 
    title: 'API 응답 속도 개선 필요', 
    body: '대시보드 로딩 시 API 응답이 3초 이상 소요됨\n\n현재: 3.2초\n목표: 1초 이내',
    status: 'open', 
    priority: 'medium',
    assignees: ['김도연']
  },
  { 
    id: 21, 
    title: '다크모드 지원 추가', 
    body: '사용자 요청이 많은 다크모드 기능을 추가합니다.',
    status: 'closed', 
    priority: 'low',
    assignees: []
  },
  { 
    id: 20, 
    title: '회원가입 이메일 인증 버그', 
    body: '이메일 인증 링크 클릭 시 404 에러 발생',
    status: 'open', 
    priority: 'high',
    assignees: ['하지연']
  },
];

const useLoungeStore = create((set, get) => ({
  // 패널 관련 상태
  activePanel: null,
  selectedIssueId: null,
  
  // 이슈 데이터
  issues: INITIAL_ISSUES,
  
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
  
  // 이슈 CRUD
  addIssue: (issueData) => {
    const newIssue = {
      id: Date.now(), // 임시 ID (실제로는 서버에서 생성)
      ...issueData,
    };
    
    set((state) => ({
      issues: [newIssue, ...state.issues], // 최신 이슈가 위로
      activePanel: 'issue', // 목록으로 돌아가기
      selectedIssueId: null,
    }));
    
    return newIssue;
  },
  
  updateIssue: (issueId, updatedData) => {
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.id === issueId ? { ...issue, ...updatedData } : issue
      ),
    }));
  },
  
  deleteIssue: (issueId) => {
    set((state) => ({
      issues: state.issues.filter((issue) => issue.id !== issueId),
      activePanel: 'issue', // 삭제 후 목록으로
      selectedIssueId: null,
    }));
  },
  
  getIssueById: (issueId) => {
    return get().issues.find((issue) => issue.id === issueId);
  },
}));

export default useLoungeStore;