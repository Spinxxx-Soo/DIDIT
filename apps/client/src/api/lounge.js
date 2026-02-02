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
     * 이슈 상태별 분포 조회 (Mock)
     */
    getIssueStatus: (projectId) => {
        return Promise.resolve({
            data: [
                { label: '완료', value: 12, color: '#10B981' },
                { label: '진행중', value: 5, color: '#3B82F6' },
                { label: '대기중', value: 8, color: '#E5E7EB' },
            ]
        });
    },

    /**
     * 이슈 우선순위별 분포 조회 (Mock)
     */
    getIssuePriority: (projectId) => {
        return Promise.resolve({
            data: [
                { label: 'High', value: 3, color: '#EF4444', bgColor: 'bg-red-100' },
                { label: 'Medium', value: 8, color: '#F59E0B', bgColor: 'bg-amber-100' },
                { label: 'Low', value: 14, color: '#10B981', bgColor: 'bg-emerald-100' },
            ]
        });
    },

    /**
     * 최근 회의록 조회 (최대 4개) (Mock)
     */
    getRecentMinutes: (projectId) => {
        return Promise.resolve({
            data: [
                {
                    id: 1,
                    title: '1주차 스프린트 계획 회의',
                    date: new Date().toISOString(),
                    channel: '기획팀',
                    summary: '이번 스프린트의 주요 목표는 MVP 기능 구현입니다. 로그인, 회원가입, 메인 대시보드 UI를 우선적으로 개발하기로 결정했습니다.',
                    content: ['기획팀 회의 진행', 'MVP 기능 범위 확정', 'UI 디자인 시안 공유']
                },
                {
                    id: 2,
                    title: 'FE/BE 인터페이스 협의',
                    date: new Date(Date.now() - 86400000).toISOString(), // 1일 전
                    channel: '개발팀',
                    summary: '프론트엔드와 백엔드 간의 API 명세서를 확정했습니다. REST API 표준을 따르기로 했으며, Swagger를 통해 문서를 공유하기로 했습니다.',
                    content: ['API 명세서 리뷰', '데이터 포맷 확정', '에러 코드 표준화']
                },
                {
                    id: 3,
                    title: '디자인 시스템 리뷰',
                    date: new Date(Date.now() - 172800000).toISOString(), // 2일 전
                    channel: '디자인팀',
                    summary: 'Apple 스타일의 깔끔하고 모던한 UI 디자인 시스템을 구축하기로 했습니다. 색상 팔레트와 타이포그래피 가이드를 확정했습니다.',
                    content: ['디자인 시스템 가이드', '컴포넌트 라이브러리 선정', '아이콘셋 확정']
                }
            ]
        });
    }
};
