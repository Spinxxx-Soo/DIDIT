/**
 * PriorityDistribution - Apple-Style Bar Chart
 * Shows issue priority distribution
 */
import React from 'react';

const PRIORITY_DATA = [
    { label: 'High', value: 4, color: '#EF4444', bgColor: 'bg-red-100' },
    { label: 'Medium', value: 3, color: '#F59E0B', bgColor: 'bg-amber-100' },
    { label: 'Low', value: 1, color: '#10B981', bgColor: 'bg-emerald-100' },
];

const MAX_VALUE = Math.max(...PRIORITY_DATA.map(d => d.value));

const PriorityDistribution = () => {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-bright)]">우선순위 분포</h3>
                <p className="text-sm text-[var(--text-tertiary)]">이슈 우선순위별 현황</p>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-4">
                {PRIORITY_DATA.map((item, index) => {
                    const percentage = (item.value / MAX_VALUE) * 100;
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
                        {PRIORITY_DATA.reduce((acc, item) => acc + item.value, 0)}개
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PriorityDistribution;
