import React, { useState, useEffect } from 'react';
import { FileText, ChevronRight, Calendar, Search, Loader2 } from 'lucide-react';
import { meetingApi } from '@/api/meeting';
import useMeetingStore from '@/store/useMeetingStore';

const MeetingMinutesList = ({ projectId, onItemClick }) => {
    const [minutesList, setMinutesList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { refreshTrigger } = useMeetingStore();

    // Reset list when project changes or refresh triggered
    useEffect(() => {
        if (projectId) {
            setMinutesList([]);
            setPage(0);
            setHasMore(true);
            loadMinutes(0, true);
        }
    }, [projectId, refreshTrigger]);

    const loadMinutes = async (pageNum, isReset = false) => {
        setIsLoading(true);
        try {
            const response = await meetingApi.getMeetingSummaries(projectId, { page: pageNum, size: 10 });
            const newItems = response.data;

            if (isReset) {
                setMinutesList(newItems);
            } else {
                setMinutesList(prev => [...prev, ...newItems]);
            }

            // If we got fewer items than requested size (10), it's the last page
            if (newItems.length < 10) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        } catch (error) {
            console.error('회의록 목록 로드 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadMinutes(nextPage);
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
                {minutesList.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                        <FileText size={32} strokeWidth={1.5} className="mb-2 opacity-50" />
                        <p className="text-xs">저장된 회의록이 없습니다.</p>
                    </div>
                ) : (
                    <>
                        {minutesList.map((item) => {
                            // summaryMd에서 미리보기 텍스트 추출
                            let preview = '';
                            let aiTitle = '';
                            try {
                                const parsed = JSON.parse(item.summaryMd || '{}');
                                const points = parsed.discussion_points || [];
                                preview = points.join(', ');
                                aiTitle = parsed.title || '';
                            } catch {
                                preview = item.summaryMd || '';
                            }

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => onItemClick(item)}
                                    className="group p-3 bg-white border border-[var(--border-default)] rounded-lg hover:shadow-sm hover:border-blue-300 cursor-pointer transition-all duration-200"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {aiTitle || item.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] mb-2">
                                        <Calendar size={10} />
                                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                        {preview}
                                    </p>
                                </div>
                            );
                        })}

                        {/* Load More Button */}
                        {hasMore && (
                            <button
                                onClick={handleLoadMore}
                                disabled={isLoading}
                                className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center gap-1"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        불러오는 중...
                                    </>
                                ) : (
                                    '더 보기'
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MeetingMinutesList;
