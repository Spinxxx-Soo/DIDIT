import React, { useState, useEffect } from 'react';
import { X, FileText, ChevronRight, Calendar, Search, Loader2 } from 'lucide-react';
import { IconButton } from '@/components/common/Button/IconButton';
import { meetingApi } from '@/api/meeting';
import AiSummaryModal from './AiSummaryModal';

const MeetingMinutesModal = ({ isOpen, onClose, projectId }) => {
    const [minutesList, setMinutesList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSummary, setSelectedSummary] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        if (isOpen && projectId) {
            loadMinutes();
        }
    }, [isOpen, projectId]);

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

    const handleItemClick = async (id) => {
        // 상세 조회 (Mock API 호출)
        try {
            const response = await meetingApi.getMeetingSummaryDetail(id);
            setSelectedSummary(response.data);
            setIsDetailOpen(true);
        } catch (error) {
            console.error('상세 조회 실패:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-40 flex justify-end">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
                    onClick={onClose}
                />

                {/* Drawer Content */}
                <div className="relative w-full max-w-md h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">회의록 목록</h2>
                            <p className="text-sm text-[var(--text-tertiary)]">지난 회의 기록을 확인하세요.</p>
                        </div>
                        <IconButton
                            icon={<X size={20} />}
                            variant="ghost"
                            onClick={onClose}
                        />
                    </div>

                    {/* Search (Optional UI) */}
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="회의 제목 검색..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                                <Loader2 size={24} className="animate-spin" />
                                <span className="text-sm">불러오는 중...</span>
                            </div>
                        ) : minutesList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <FileText size={40} strokeWidth={1.5} className="mb-2 opacity-50" />
                                <p className="text-sm">저장된 회의록이 없습니다.</p>
                            </div>
                        ) : (
                            minutesList.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item.id)}
                                    className="group p-4 bg-white border border-[var(--border-default)] rounded-xl hover:shadow-md hover:border-blue-200 cursor-pointer transition-all duration-200"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-blue-600 transition-colors">
                                            {item.title}
                                        </h3>
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mb-3">
                                        <Calendar size={12} />
                                        <span>{new Date(item.date).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                                        {item.summaryPreview}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            <AiSummaryModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                summary={selectedSummary}
            />
        </>
    );
};

export default MeetingMinutesModal;
