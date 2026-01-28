import React from 'react';
import { Rnd } from 'react-rnd';
import { X, Calendar, List, CheckSquare, Download, Minus } from 'lucide-react';
import { IconButton } from '@/components/common/Button/IconButton';
import { Divider } from '@/components/common/Divider';

const DraggableSummaryWindow = ({ isOpen, onClose, summary }) => {
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
        <div className="fixed inset-0 pointer-events-none z-50">
            <Rnd
                default={{
                    x: window.innerWidth - 500,
                    y: 100,
                    width: 480,
                    height: 600,
                }}
                minWidth={320}
                minHeight={400}
                bounds="window"
                className="pointer-events-auto bg-white rounded-xl shadow-2xl flex flex-col border border-[var(--border-default)] overflow-hidden"
                dragHandleClassName="drag-handle"
            >
                {/* Header (Draggable Area) */}
                <div className="drag-handle flex items-center justify-between px-4 py-3 border-b bg-[var(--bg-secondary)] cursor-move select-none">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">✨</span>
                        <h2 className="font-bold text-[var(--text-primary)] text-sm">AI 회의 요약</h2>
                    </div>
                    <div className="flex items-center gap-1 on-drag-cancel">
                        <IconButton
                            icon={<Download size={16} />}
                            variant="ghost"
                            size="xs"
                            title="다운로드"
                            className="on-drag-cancel"
                            onClick={() => alert('PDF 다운로드 기능 준비중')}
                        />
                        {/* 최소화 버튼 개념으로 닫기 */}
                        <IconButton
                            icon={<X size={16} />}
                            variant="ghost"
                            size="xs"
                            onClick={onClose}
                            className="on-drag-cancel"
                        />
                    </div>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white cursor-default">
                    {/* Title & Date */}
                    <div>
                        <h1 className="text-lg font-bold text-[var(--text-primary)] mb-1 leading-tight">
                            {summary.title || '제목 없는 회의'}
                        </h1>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <Calendar size={12} />
                            <span>{formatDate(summary.date)}</span>
                        </div>
                    </div>

                    <Divider />

                    {/* Summary Content */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-2">
                            <List size={16} className="text-blue-500" />
                            주요 논의 사항
                        </h3>
                        <ul className="space-y-2 pl-1.5">
                            {summary.content && summary.content.map((item, index) => (
                                <li key={index} className="flex gap-2.5 text-sm text-[var(--text-secondary)] leading-relaxed">
                                    <span className="text-blue-400 mt-1.5 text-[10px]">●</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <Divider />

                    {/* Action Items */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-2">
                            <CheckSquare size={16} className="text-green-500" />
                            Action Items
                        </h3>
                        <div className="space-y-2">
                            {summary.actionItems && summary.actionItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        defaultChecked={item.checked}
                                        className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className={`text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-[var(--text-secondary)]'}`}>
                                        {item.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Resize Handle Customization (Optional - library handles it, but we can add visual cues) */}
            </Rnd>
        </div>
    );
};

export default DraggableSummaryWindow;
