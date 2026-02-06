/**
 * IssueStatusChart - Apple-Style Donut Chart
 * Shows issue status distribution
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useLoungeStore from '@/store/useLoungeStore';
import useProjectStore from '@/store/useProjectStore';
import { ExternalLink } from 'lucide-react';

const IssueStatusChart = () => {
    const { projectId } = useParams();
    const { openIssueMode, issues } = useLoungeStore();
    const { currentProject } = useProjectStore();
    const [statusData, setStatusData] = useState([
        { label: '진행 중', value: 0, color: '#3B82F6' },
        { label: '완료', value: 0, color: '#10B981' },
    ]);

    // GitHub 저장소 연동 여부 확인
    const isGithubConnected = !!currentProject?.repoFullName;

    useEffect(() => {
        // GitHub 미연동 시 집계하지 않음
        if (!isGithubConnected) {
            setStatusData([
                { label: '진행 중', value: 0, color: '#3B82F6' },
                { label: '완료', value: 0, color: '#10B981' },
            ]);
            return;
        }

        // [수정됨] useLoungeStore의 issues를 직접 사용하여 집계
        // 이슈 생성/수정/삭제 시 자동으로 재집계됨
        const openCount = issues.filter(issue => issue.status === 'open').length;
        const closedCount = issues.filter(issue => issue.status === 'closed').length;

        setStatusData([
            { label: '진행 중', value: openCount, color: '#3B82F6' },
            { label: '완료', value: closedCount, color: '#10B981' },
        ]);
    }, [issues, isGithubConnected]);

    const total = statusData.reduce((acc, item) => acc + item.value, 0);

    // Calculate SVG arc paths for donut chart
    const createDonutSegments = () => {
        if (total === 0) return null;

        let cumulativePercentage = 0;
        const segments = [];
        const radius = 40;
        const strokeWidth = 12;
        const center = 50;

        statusData.forEach((item, index) => {
            const percentage = (item.value / total) * 100;
            const circumference = 2 * Math.PI * radius;
            const strokeDasharray = (percentage / 100) * circumference;
            const strokeDashoffset = -cumulativePercentage / 100 * circumference;

            segments.push(
                <circle
                    key={index}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${strokeDasharray} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                    style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                        animationDelay: `${index * 100}ms`
                    }}
                />
            );
            cumulativePercentage += percentage;
        });

        return segments;
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--text-bright)]">이슈 상태 개요</h3>
                    <p className="text-sm text-[var(--text-tertiary)]">전체 업무 현황</p>
                </div>
                {isGithubConnected && (
                    <button
                        onClick={openIssueMode}
                        className="
                            flex items-center gap-1.5
                            text-sm text-[var(--color-green-primary)]
                            hover:underline
                            transition-all
                        "
                    >
                        전체 보기
                        <ExternalLink size={14} />
                    </button>
                )}
            </div>

            <div className="flex-1 flex items-center justify-center">
                <div className="relative">
                    {/* Donut Chart */}
                    <svg width="160" height="160" viewBox="0 0 100 100" className="animate-fade-up">
                        {/* Background Circle for Empty State */}
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                        {createDonutSegments()}
                    </svg>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-[var(--text-bright)]">{total}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">총 업무 수</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
                {statusData.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-[var(--text-secondary)]">
                            {item.label}: {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IssueStatusChart;
