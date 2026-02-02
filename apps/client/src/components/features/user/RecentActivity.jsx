/**
 * RecentActivity - Apple-Style Activity Feed
 * Shows recent team actions in timeline format
 */
import React from 'react';
import { Avatar } from '@/components/common/Avatar/Avatar';

const MOCK_ACTIVITIES = [
    {
        id: 1,
        user: '김도연',
        action: '이슈를 완료했습니다',
        target: '#143 로그인 버그 수정',
        time: '10분 전',
        type: 'complete',
    },
    {
        id: 2,
        user: '이다연',
        action: '새 이슈를 생성했습니다',
        target: '#145 API 최적화',
        time: '1시간 전',
        type: 'create',
    },
    {
        id: 3,
        user: '하지연',
        action: '회의록을 업로드했습니다',
        target: '주간 스프린트 회의',
        time: '2시간 전',
        type: 'upload',
    },
    {
        id: 4,
        user: '홍수민',
        action: '이슈 상태를 변경했습니다',
        target: '#142 → 진행중',
        time: '3시간 전',
        type: 'update',
    },
    {
        id: 5,
        user: '이강인',
        action: '댓글을 남겼습니다',
        target: '#140 결제 모듈 연동',
        time: '5시간 전',
        type: 'comment',
    },
];

const getActionColor = (type) => {
    const colors = {
        complete: 'text-emerald-500',
        create: 'text-blue-500',
        upload: 'text-violet-500',
        update: 'text-amber-500',
        comment: 'text-gray-500',
    };
    return colors[type] || 'text-gray-500';
};

const RecentActivity = () => {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-bright)]">최근 활동</h3>
                <p className="text-sm text-[var(--text-tertiary)]">팀의 최신 작업 현황</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {MOCK_ACTIVITIES.map((activity, index) => (
                    <div
                        key={activity.id}
                        className="flex gap-3 animate-fade-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <Avatar name={activity.user} size="sm" className="shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--text-bright)]">
                                <span className="font-medium">{activity.user}</span>
                                <span className="text-[var(--text-secondary)]"> 님이 </span>
                                <span className={getActionColor(activity.type)}>{activity.action}</span>
                            </p>
                            <p className="text-sm text-[var(--text-tertiary)] truncate">
                                {activity.target}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1">
                                {activity.time}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivity;
