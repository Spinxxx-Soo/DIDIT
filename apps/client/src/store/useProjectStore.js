import { create } from 'zustand';
import { projectApi } from '@/api/project';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

/**
 * Mock 프로젝트 데이터
 */
const MOCK_PROJECTS = [
  {
    id: 1,
    name: '알고리즘 스터디',
    ownerId: 1,
    thumbnailUrl: null,
    repoFullName: 'ssafy/algo-study',
    memberCount: 6,
    lastAccessed: '2시간 전',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: '공통 프로젝트',
    ownerId: 2,
    thumbnailUrl: null,
    repoFullName: 'ssafy/common-project',
    memberCount: 6,
    lastAccessed: '1일 전',
    createdAt: '2024-01-20T14:30:00Z',
  },
  {
    id: 3,
    name: '자율 프로젝트',
    ownerId: 1,
    thumbnailUrl: null,
    repoFullName: null,
    memberCount: 4,
    lastAccessed: '3일 전',
    createdAt: '2024-01-25T09:00:00Z',
  },
];

/**
 * Mock 참여자 데이터
 */
const MOCK_PARTICIPANTS = [
  { id: 1, name: '김이', avatarUrl: null },
  { id: 2, name: '이다연', avatarUrl: null },
  { id: 3, name: '손율준', avatarUrl: null },
  { id: 4, name: '하지연', avatarUrl: null },
  { id: 5, name: '홍수민', avatarUrl: null },
];

const useProjectStore = create((set, get) => ({
  // State
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  // ------------------------------------------------------------------
  // [1] 프로젝트 목록 조회
  // ------------------------------------------------------------------
  fetchProjects: async () => {
    set({ isLoading: true, error: null });

    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ projects: MOCK_PROJECTS, isLoading: false });
      return;
    }

    try {
      const response = await projectApi.getProjects();
      const projectsData = Array.isArray(response.data) ? response.data : [];
      set({ projects: projectsData, isLoading: false });
    } catch (error) {
      console.error('프로젝트 목록 조회 실패:', error);
      set({
        projects: [],
        error: '프로젝트 목록을 불러올 수 없습니다',
        isLoading: false
      });
    }
  },

  // ------------------------------------------------------------------
  // [2] 프로젝트 상세 조회
  // ------------------------------------------------------------------
  fetchProject: async (projectId) => {
    set({ isLoading: true, error: null });

    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const project = MOCK_PROJECTS.find(p => p.id === Number(projectId));
      set({ currentProject: project || null, isLoading: false });
      return project;
    }

    try {
      const response = await projectApi.getProject(projectId);
      set({ currentProject: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('프로젝트 조회 실패:', error);
      set({ error: '프로젝트를 불러올 수 없습니다', isLoading: false });
      return null;
    }
  },

  // ------------------------------------------------------------------
  // [3] 프로젝트 생성
  // ------------------------------------------------------------------
  createProject: async ({ name, imageFile, githubRepo }) => {
    set({ isLoading: true, error: null });

    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const newProject = {
        id: Date.now(),
        name,
        thumbnailUrl: imageFile ? URL.createObjectURL(imageFile) : null,
        repoFullName: githubRepo || null,
        createdAt: new Date().toISOString(),
      };

      set(state => ({
        projects: [...state.projects, newProject],
        isLoading: false,
      }));

      return { success: true, project: newProject };
    }

    try {
      // Backend API expects: { projectName, githubUrl }
      const data = {
        projectName: name,
        githubUrl: githubRepo || null,
      };

      const response = await projectApi.createProject(data);

      set(state => ({
        projects: [...state.projects, response.data],
        isLoading: false,
      }));

      return { success: true, project: response.data };
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
      set({ error: '프로젝트 생성에 실패했습니다', isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ------------------------------------------------------------------
  // [4] 프로젝트 이름 중복 체크
  // ------------------------------------------------------------------
  validateProjectName: async (name) => {
    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const { projects } = get();
      const isDuplicate = projects.some(
        p => p.name.toLowerCase() === name.toLowerCase()
      );
      return isDuplicate;
    }

    try {
      const response = await projectApi.checkNameDuplicate(name);
      return response.data.isDuplicate;
    } catch (error) {
      console.error('이름 중복 체크 실패:', error);
      return false; // 에러 시 통과 (서버에서 재검증)
    }
  },

  // ------------------------------------------------------------------
  // [5] GitHub 저장소 검증
  // ------------------------------------------------------------------
  validateGithubRepo: async (repo) => {
    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 400));

      // Mock: 특정 패턴만 성공 처리
      const validRepos = ['ssafy/algo-study', 'ssafy/common-project', 'organization/repo'];

      if (validRepos.some(r => repo.toLowerCase().includes(r.split('/')[0]))) {
        return { success: true };
      }

      if (repo.startsWith('private/')) {
        return { success: false, error: '권한 없는 저장소입니다' };
      }

      return { success: false, error: '유효한 레퍼지토리가 아닙니다' };
    }

    try {
      const response = await projectApi.validateGithubRepo(repo);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || '저장소 검증에 실패했습니다';
      return { success: false, error: errorMessage };
    }
  },

  // ------------------------------------------------------------------
  // [6] 프로젝트 삭제
  // ------------------------------------------------------------------
  deleteProject: async (projectId) => {
    set({ isLoading: true, error: null });

    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      set(state => ({
        projects: state.projects.filter(p => p.id !== projectId),
        isLoading: false,
      }));
      return { success: true };
    }

    try {
      await projectApi.deleteProject(projectId);
      set(state => ({
        projects: state.projects.filter(p => p.id !== projectId),
        isLoading: false,
      }));
      return { success: true };
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error);
      set({ error: '프로젝트 삭제에 실패했습니다', isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ------------------------------------------------------------------
  // [7] 프로젝트 GitHub 저장소 업데이트
  // ------------------------------------------------------------------
  updateProjectRepo: async (projectId, repoFullName) => {
    set({ isLoading: true, error: null });

    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));

      set(state => ({
        projects: state.projects.map(p =>
          p.id === Number(projectId) ? { ...p, repoFullName } : p
        ),
        currentProject: state.currentProject?.id === Number(projectId)
          ? { ...state.currentProject, repoFullName }
          : state.currentProject,
        isLoading: false,
      }));

      return { success: true };
    }

    try {
      await projectApi.updateProjectRepo(projectId, repoFullName);

      set(state => ({
        projects: state.projects.map(p =>
          p.id === Number(projectId) ? { ...p, repoFullName } : p
        ),
        currentProject: state.currentProject?.id === Number(projectId)
          ? { ...state.currentProject, repoFullName }
          : state.currentProject,
        isLoading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error('저장소 업데이트 실패:', error);
      set({ error: '저장소 연결에 실패했습니다', isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ------------------------------------------------------------------
  // [8] 에러 초기화
  // ------------------------------------------------------------------
  clearError: () => set({ error: null }),

  // ------------------------------------------------------------------
  // [9] 프로젝트 이름 수정
  // ------------------------------------------------------------------
  updateProjectName: async (projectId, name) => {
    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      set(state => ({
        projects: state.projects.map(p =>
          p.id === Number(projectId) ? { ...p, name } : p
        ),
      }));
      return { success: true };
    }

    try {
      await projectApi.updateProjectName(projectId, name);
      set(state => ({
        projects: state.projects.map(p =>
          p.id === Number(projectId) ? { ...p, name } : p
        ),
      }));
      return { success: true };
    } catch (error) {
      console.error('프로젝트 이름 수정 실패:', error);
      return { success: false, error: error.message };
    }
  },

  // ------------------------------------------------------------------
  // [10] 프로젝트 떠나기
  // ------------------------------------------------------------------
  leaveProject: async (projectId) => {
    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      set(state => ({
        projects: state.projects.filter(p => p.id !== Number(projectId)),
      }));
      return { success: true };
    }

    try {
      await projectApi.leaveProject(projectId);
      set(state => ({
        projects: state.projects.filter(p => p.id !== Number(projectId)),
      }));
      return { success: true };
    } catch (error) {
      console.error('프로젝트 떠나기 실패:', error);
      return { success: false, error: error.message };
    }
  },

  // ------------------------------------------------------------------
  // [11] 팀장 위임
  // ------------------------------------------------------------------
  transferOwnership: async (projectId, newOwnerId) => {
    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      set(state => ({
        projects: state.projects.map(p =>
          p.id === Number(projectId) ? { ...p, ownerId: newOwnerId } : p
        ),
      }));
      return { success: true };
    }

    try {
      await projectApi.transferOwnership(projectId, newOwnerId);
      set(state => ({
        projects: state.projects.map(p =>
          p.id === Number(projectId) ? { ...p, ownerId: newOwnerId } : p
        ),
      }));
      return { success: true };
    } catch (error) {
      console.error('팀장 위임 실패:', error);
      return { success: false, error: error.message };
    }
  },

  // ------------------------------------------------------------------
  // [12] 프로젝트 참여자 조회
  // ------------------------------------------------------------------
  fetchParticipants: async (projectId) => {
    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return MOCK_PARTICIPANTS;
    }

    try {
      const response = await projectApi.getParticipants(projectId);
      return response.data;
    } catch (error) {
      console.error('참여자 조회 실패:', error);
      return [];
    }
  },
}));

export default useProjectStore;
