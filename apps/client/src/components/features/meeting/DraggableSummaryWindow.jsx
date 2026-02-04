import React from 'react';
import ReactDOM from 'react-dom';
import { Rnd } from 'react-rnd';
import { X, Calendar, List, CheckSquare, Download, Minus, Edit2, Save, RotateCcw } from 'lucide-react';
import { IconButton } from '@/components/common/Button/IconButton';
import { Divider } from '@/components/common/Divider';
import { meetingApi } from '@/api/meeting';

const DraggableSummaryWindow = ({ isOpen, onClose, summary: initialSummary }) => {
    const [summary, setSummary] = React.useState(initialSummary);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editForm, setEditForm] = React.useState(null);

    React.useEffect(() => {
        setSummary(initialSummary);
        setEditForm(initialSummary);
    }, [initialSummary]);

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
        if (!isEditing) return;
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

    return ReactDOM.createPortal(
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            <Rnd
                default={{
                    x: window.innerWidth / 2 - 240, // Center horizontally
                    y: window.innerHeight / 2 - 300, // Center vertically
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
                <div className="drag-handle flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-[var(--bg-secondary)] cursor-move select-none">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">✨</span>
                        <h2 className="font-bold text-[var(--text-primary)] text-sm">AI 회의 요약</h2>
                    </div>
                    <div className="flex items-center gap-1 on-drag-cancel">
                        {isEditing ? (
                            <>
                                <IconButton
                                    icon={<Save size={16} />}
                                    variant="ghost"
                                    size="xs"
                                    title="저장"
                                    className="on-drag-cancel text-green-600"
                                    onClick={handleSaveClick}
                                />
                                <IconButton
                                    icon={<RotateCcw size={16} />}
                                    variant="ghost"
                                    size="xs"
                                    title="취소"
                                    className="on-drag-cancel"
                                    onClick={handleCancelClick}
                                />
                            </>
                        ) : (
                            <IconButton
                                icon={<Edit2 size={16} />}
                                variant="ghost"
                                size="xs"
                                title="수정"
                                className="on-drag-cancel"
                                onClick={handleEditClick}
                            />
                        )}
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
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.title}
                                onChange={handleTitleChange}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-2xl font-bold mb-1 focus:outline-blue-500"
                            />
                        ) : (
                            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1 leading-tight">
                                {summary.title || '제목 없는 회의'}
                            </h1>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <Calendar size={12} />
                            <span>{formatDate(summary.date)}</span>
                        </div>
                    </div>

                    <Divider className="bg-gray-300" />

                    {/* Summary Content */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-2">
                            <List size={16} className="text-green-500" />
                            주요 논의 사항
                        </h3>
                        <ul className="space-y-2 pl-1.5">
                            {(isEditing ? editForm.content : summary.content) && (isEditing ? editForm.content : summary.content).map((item, index) => (
                                <li key={index} className="flex gap-2.5 text-sm text-[var(--text-secondary)] leading-relaxed">
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
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-2">
                            <CheckSquare size={16} className="text-green-500" />
                            Action Items
                        </h3>
                        <div className="space-y-2">
                            {(isEditing ? editForm.actionItems : summary.actionItems) && (isEditing ? editForm.actionItems : summary.actionItems).map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => handleActionItemCheckChange(item.id)}
                                        disabled={!isEditing}
                                        className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-default"
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

                {/* Resize Handle Customization */}
            </Rnd>
        </div >,
        document.body
    );
};

export default DraggableSummaryWindow;
