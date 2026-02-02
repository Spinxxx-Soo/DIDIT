/**
 * IssueStatusChart - Apple-Style Donut Chart
 * Shows issue status distribution
 */
import React from 'react';
import useLoungeStore from '@/store/useLoungeStore';
import { ExternalLink } from 'lucide-react';

const STATUS_DATA = [
    { label: '완료', value: 31, color: '#10B981' },
    { label: '진행중', value: 8, color: '#3B82F6' },
    { label: '대기중', value: 1, color: '#E5E7EB' },
];

const TOTAL = STATUS_DATA.reduce((acc, item) => acc + item.value, 0);

const IssueStatusChart = () => {
    const { openIssueMode } = useLoungeStore();

    // Calculate SVG arc paths for donut chart
    const createDonutSegments = () => {
        let cumulativePercentage = 0;
        const segments = [];
        const radius = 40;
        const strokeWidth = 12;
        const center = 50;

        STATUS_DATA.forEach((item, index) => {
            const percentage = (item.value / TOTAL) * 100;
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
            </div>

            <div className="flex-1 flex items-center justify-center">
                <div className="relative">
                    {/* Donut Chart */}
                    <svg width="160" height="160" viewBox="0 0 100 100" className="animate-fade-up">
                        {createDonutSegments()}
                    </svg>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-[var(--text-bright)]">{TOTAL}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">총 업무 수</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
                {STATUS_DATA.map((item) => (
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
