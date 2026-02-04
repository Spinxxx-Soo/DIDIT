/**
 * PriorityDistribution - Apple-Style Bar Chart
 * Shows issue priority distribution
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { loungeApi } from '@/api/lounge';
import useProjectStore from '@/store/useProjectStore';

const PriorityDistribution = () => {
    const { projectId } = useParams();
    const { currentProject } = useProjectStore();
    const [priorityData, setPriorityData] = useState([
        { label: 'High', value: 0, color: '#EF4444' },
        { label: 'Medium', value: 0, color: '#F59E0B' },
        { label: 'Low', value: 0, color: '#10B981' },
    ]);

    // GitHub 저장소 연동 여부 확인
    const isGithubConnected = !!currentProject?.repoFullName;

    useEffect(() => {
        const fetchAndAggregate = async () => {
            // GitHub 미연동 시 API 호출하지 않음
            if (!projectId || !isGithubConnected) return;
            try {
                const response = await loungeApi.getIssues(projectId);
                const issues = response.data || [];

                // 프론트엔드에서 우선순위별 집계
                const highCount = issues.filter(issue => issue.priority === 'HIGH').length;
                const mediumCount = issues.filter(issue => issue.priority === 'MEDIUM').length;
                const lowCount = issues.filter(issue => issue.priority === 'LOW').length;

                setPriorityData([
                    { label: 'High', value: highCount, color: '#EF4444' },
                    { label: 'Medium', value: mediumCount, color: '#F59E0B' },
                    { label: 'Low', value: lowCount, color: '#10B981' },
                ]);
            } catch (error) {
                console.error('Failed to fetch issues:', error);
            }
        };
        fetchAndAggregate();
    }, [projectId, isGithubConnected]);

    const maxValue = Math.max(...priorityData.map(d => d.value)) || 1;

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-bright)]">우선순위 분포</h3>
                <p className="text-sm text-[var(--text-tertiary)]">이슈 우선순위별 현황</p>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-4">
                {priorityData.map((item, index) => {
                    const percentage = (item.value / maxValue) * 100;
                    return (
                        <div
                            key={item.label}
                            className="animate-fade-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-[var(--text-secondary)]">
                                    {item.label}
                                </span>
                                <span className="text-sm font-semibold text-[var(--text-bright)]">
                                    {item.value}개
                                </span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: item.color,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">전체 이슈</span>
                    <span className="font-semibold text-[var(--text-bright)]">
                        {priorityData.reduce((acc, item) => acc + item.value, 0)}개
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PriorityDistribution;
