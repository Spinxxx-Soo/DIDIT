import React, { useRef, useEffect } from 'react';
import { X, Calendar, List, CheckSquare, Download, Share2 } from 'lucide-react';
import { IconButton } from '@/components/common/Button/IconButton';
import { Divider } from '@/components/common/Divider';

const AiSummaryModal = ({ isOpen, onClose, summary }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !summary) return null;

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col m-4 animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
                            ✨ AI 회의 요약
                        </h2>
                        <p className="text-sm text-[var(--text-tertiary)] mt-1">
                            회의 내용을 자동으로 요약하고 할 일을 추출했습니다.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <IconButton
                            icon={<Download size={18} />}
                            variant="ghost"
                            size="sm"
                            title="다운로드"
                            onClick={() => alert('PDF 다운로드 기능 준비중')}
                        />
                        <IconButton
                            icon={<X size={20} />}
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        />
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Title & Date */}
                    <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
                        <h1 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                            {summary.title || '제목 없는 회의'}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <Calendar size={14} />
                            <span>{formatDate(summary.date)}</span>
                        </div>
                    </div>

                    {/* Summary Content */}
                    <section>
                        <h3 className="flex items-center gap-2 font-semibold text-[var(--text-primary)] mb-3">
                            <List size={18} className="text-blue-500" />
                            주요 논의 사항
                        </h3>
                        <ul className="space-y-2 pl-2">
                            {summary.content && summary.content.map((item, index) => (
                                <li key={index} className="flex gap-3 text-[var(--text-secondary)] leading-relaxed">
                                    <span className="text-blue-400 mt-1.5">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <Divider />

                    {/* Action Items */}
                    <section>
                        <h3 className="flex items-center gap-2 font-semibold text-[var(--text-primary)] mb-3">
                            <CheckSquare size={18} className="text-green-500" />
                            Action Items
                        </h3>
                        <div className="space-y-2">
                            {summary.actionItems && summary.actionItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-default)] bg-white hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        defaultChecked={item.checked}
                                        className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className={`text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-[var(--text-secondary)]'}`}>
                                        {item.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-[var(--bg-secondary)] rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors"
                    >
                        닫기
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-blue-600 rounded-md transition-colors shadow-sm"
                    >
                        확인 완료
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiSummaryModal;
