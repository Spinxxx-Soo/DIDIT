import React, { useState, useEffect } from 'react';
import { FileText, ChevronRight, Calendar, Search, Loader2 } from 'lucide-react';
import { meetingApi } from '@/api/meeting';

const MeetingMinutesList = ({ projectId, onItemClick }) => {
    const [minutesList, setMinutesList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (projectId) {
            loadMinutes();
        }
    }, [projectId]);

    const loadMinutes = async () => {
        setIsLoading(true);
        try {
            const response = await meetingApi.getMeetingSummaries(projectId);
            setMinutesList(response.data);
        } catch (error) {
            console.error('회의록 목록 로드 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search (Optional UI) */}
            <div className="px-4 py-2 border-b border-gray-300 bg-[var(--bg-sidebar)]">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="회의 제목 검색"
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[var(--border-default)] rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[var(--bg-sidebar)]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 gap-2 text-gray-400">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-xs">불러오는 중...</span>
                    </div>
                ) : minutesList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                        <FileText size={32} strokeWidth={1.5} className="mb-2 opacity-50" />
                        <p className="text-xs">저장된 회의록이 없습니다.</p>
                    </div>
                ) : (
                    minutesList.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onItemClick(item.id)}
                            className="group p-3 bg-white border border-[var(--border-default)] rounded-lg hover:shadow-sm hover:border-blue-300 cursor-pointer transition-all duration-200"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-blue-600 transition-colors line-clamp-1">
                                    {item.title}
                                </h3>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] mb-2">
                                <Calendar size={10} />
                                <span>{new Date(item.date).toLocaleDateString()}</span>
                            </div>

                            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                {item.summaryPreview}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MeetingMinutesList;
