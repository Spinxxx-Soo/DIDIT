/**
 * StatCards - Apple-Style Dashboard Stat Cards
 * 4 key metrics at a glance
 */
import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';

const STATS = [
    {
        id: 'completed',
        label: '완료된 이슈',
        value: 12,
        subtext: '지난 7일',
        icon: CheckCircle2,
        gradient: 'from-emerald-50 to-emerald-100',
        iconColor: 'text-emerald-500',
    },
    {
        id: 'inProgress',
        label: '진행 중',
        value: 5,
        subtext: '현재',
        icon: Clock,
        gradient: 'from-blue-50 to-blue-100',
        iconColor: 'text-blue-500',
    },
    {
        id: 'deadline',
        label: '마감 임박',
        value: 3,
        subtext: '3일 이내',
        icon: AlertTriangle,
        gradient: 'from-amber-50 to-amber-100',
        iconColor: 'text-amber-500',
    },
    {
        id: 'meetings',
        label: '이번 주 회의',
        value: 2,
        subtext: '예정',
        icon: Calendar,
        gradient: 'from-violet-50 to-violet-100',
        iconColor: 'text-violet-500',
    },
];

const StatCards = () => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.id}
                        className="
              bg-white
              rounded-[var(--radius-xl)]
              border border-[var(--border-subtle)]
              p-5
              transition-all duration-300
              hover:shadow-[var(--shadow-md)]
              hover:-translate-y-0.5
              animate-fade-up
            "
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`
                w-10 h-10
                rounded-xl
                bg-gradient-to-br ${stat.gradient}
                flex items-center justify-center
                ${stat.iconColor}
              `}>
                                <Icon size={20} />
                            </div>
                            <span className="text-xs text-[var(--text-tertiary)]">{stat.subtext}</span>
                        </div>
                        <div className="text-3xl font-bold text-[var(--text-bright)] mb-1">
                            {stat.value}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)]">
                            {stat.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatCards;
