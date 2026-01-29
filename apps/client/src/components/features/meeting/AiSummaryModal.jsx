import React, { useRef, useEffect, useState } from 'react';
import { X, Calendar, List, CheckSquare, Download, Edit2, Save, RotateCcw } from 'lucide-react';
import { IconButton } from '@/components/common/Button/IconButton';
import { Divider } from '@/components/common/Divider';

import { meetingApi } from '@/api/meeting';

const AiSummaryModal = ({ isOpen, onClose, summary: initialSummary }) => {
    const modalRef = useRef(null);
    const [summary, setSummary] = useState(initialSummary);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(null);

    useEffect(() => {
        setSummary(initialSummary);
        setEditForm(initialSummary);
    }, [initialSummary]);


    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && !isEditing) onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
            setIsEditing(false); // 모달 닫힐 때 에디트 모드 종료
        };
    }, [isOpen, onClose, isEditing]);

    const handleEditClick = () => {
        setEditForm(summary);
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
        setEditForm(summary);
    };

    const handleSaveClick = async () => {
        try {
            // API 호출 (Mock)
            await meetingApi.updateMeetingSummary(summary.id, editForm);
            setSummary(editForm);
            setIsEditing(false);
            alert('저장되었습니다.');
        } catch (error) {
            console.error('저장 실패:', error);
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    const handleTitleChange = (e) => {
        setEditForm(prev => ({ ...prev, title: e.target.value }));
    };

    const handleContentChange = (index, value) => {
        const newContent = [...editForm.content];
        newContent[index] = value;
        setEditForm(prev => ({ ...prev, content: newContent }));
    };

    const handleActionItemTextChange = (id, value) => {
        const newActionItems = editForm.actionItems.map(item =>
            item.id === id ? { ...item, text: value } : item
        );
        setEditForm(prev => ({ ...prev, actionItems: newActionItems }));
    };

    const handleActionItemCheckChange = (id) => {
        if (!isEditing) return; // 뷰 모드에서는 체크박스 동작 안함 (또는 별도 API 필요)
        const newActionItems = editForm.actionItems.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        );
        setEditForm(prev => ({ ...prev, actionItems: newActionItems }));
    };

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
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.title}
                                onChange={handleTitleChange}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-2xl font-bold mb-2 focus:outline-blue-500"
                            />
                        ) : (
                            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                                {summary.title || '제목 없는 회의'}
                            </h1>
                        )}
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
                            {(isEditing ? editForm.content : summary.content) && (isEditing ? editForm.content : summary.content).map((item, index) => (
                                <li key={index} className="flex gap-3 text-[var(--text-secondary)] leading-relaxed">
                                    <span className="text-green-500 mt-1.5 text-[10px]">●</span>
                                    {isEditing ? (
                                        <textarea
                                            value={item}
                                            onChange={(e) => handleContentChange(index, e.target.value)}
                                            className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm resize-none focus:outline-blue-500"
                                            rows={2}
                                        />
                                    ) : (
                                        <span>{item}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>



                    <Divider className="bg-gray-300" />

                    {/* Action Items */}
                    <section>
                        <h3 className="flex items-center gap-2 font-semibold text-[var(--text-primary)] mb-3">
                            <CheckSquare size={18} className="text-green-500" />
                            Action Items
                        </h3>
                        <div className="space-y-2">
                            {(isEditing ? editForm.actionItems : summary.actionItems) && (isEditing ? editForm.actionItems : summary.actionItems).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-default)] bg-white hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => handleActionItemCheckChange(item.id)}
                                        disabled={!isEditing}
                                        className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-default"
                                    />
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={item.text}
                                            onChange={(e) => handleActionItemTextChange(item.id, e.target.value)}
                                            className="flex-1 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none text-sm px-1"
                                        />
                                    ) : (
                                        <span className={`text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-[var(--text-secondary)]'}`}>
                                            {item.text}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-[var(--bg-secondary)] rounded-b-xl flex justify-between gap-3">
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSaveClick}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
                                >
                                    <Save size={16} />
                                    저장
                                </button>
                                <button
                                    onClick={handleCancelClick}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                    <RotateCcw size={16} />
                                    취소
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleEditClick}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                <Edit2 size={16} />
                                수정
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors"
                        >
                            닫기
                        </button>
                        {!isEditing && (
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-blue-600 rounded-md transition-colors shadow-sm"
                            >
                                확인 완료
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiSummaryModal;
