import React from 'react';
import ReactDOM from 'react-dom';
import { Rnd } from 'react-rnd';
import { X, Calendar, List, CheckSquare, Download, Edit2, Save, RotateCcw, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { IconButton } from '@/components/common/Button/IconButton';
import { Divider } from '@/components/common/Divider';
import { ConfirmModal } from '@/components/common/Modal/ConfirmModal';
import { meetingApi } from '@/api/meeting';
import useMeetingStore from '@/store/useMeetingStore';

/**
 * summaryMd JSON을 파싱하여 구조화된 데이터를 반환
 * action_items는 string 또는 {text, checked} 형태 모두 처리
 */
const parseSummaryMd = (summaryMd) => {
    try {
        const parsed = JSON.parse(summaryMd || '{}');
        return {
            title: parsed.title || '',
            discussionPoints: parsed.discussion_points || [],
            actionItems: (parsed.action_items || []).map((item, index) =>
                typeof item === 'string'
                    ? { id: index, text: item, checked: false }
                    : { id: index, text: item.text, checked: !!item.checked }
            ),
        };
    } catch {
        return { discussionPoints: [], actionItems: [] };
    }
};

/**
 * 구조화된 데이터를 summaryMd JSON 문자열로 변환
 */
const buildSummaryMd = (title, discussionPoints, actionItems) => {
    return JSON.stringify({
        title: title,
        discussion_points: discussionPoints,
        action_items: actionItems.map(item => ({ text: item.text, checked: item.checked })),
    });
};

const DraggableSummaryWindow = ({ isOpen, onClose, summary: initialSummary, projectId, onDelete }) => {
    const [summary, setSummary] = React.useState(initialSummary);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editTitle, setEditTitle] = React.useState('');
    const [editDiscussionPoints, setEditDiscussionPoints] = React.useState([]);
    const [editActionItems, setEditActionItems] = React.useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const { triggerRefresh } = useMeetingStore();
    const contentRef = React.useRef(null);

    // summary 데이터에서 파싱된 구조화 데이터
    const parsed = React.useMemo(() => parseSummaryMd(summary?.summaryMd), [summary?.summaryMd]);

    React.useEffect(() => {
        setSummary(initialSummary);
    }, [initialSummary]);

    const handleEditClick = () => {
        setEditTitle(parsed.title || summary.title);
        setEditDiscussionPoints([...parsed.discussionPoints]);
        setEditActionItems(parsed.actionItems.map(item => ({ ...item })));
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
    };

    const handleSaveClick = async () => {
        try {
            const newSummaryMd = buildSummaryMd(editTitle, editDiscussionPoints, editActionItems);
            await meetingApi.updateMeetingSummary(projectId, summary.id, {
                title: editTitle,
                summary: newSummaryMd,
            });
            setSummary(prev => ({ ...prev, title: editTitle, summaryMd: newSummaryMd }));
            setIsEditing(false);
            triggerRefresh();
        } catch (error) {
            console.error('저장 실패:', error);
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    // 체크박스 토글 시 즉시 저장 (편집 모드 아닐 때)
    const handleActionItemCheckToggle = async (index) => {
        const updatedItems = parsed.actionItems.map((item, i) =>
            i === index ? { ...item, checked: !item.checked } : item
        );
        const newSummaryMd = buildSummaryMd(parsed.title, parsed.discussionPoints, updatedItems);

        // 낙관적 업데이트
        setSummary(prev => ({ ...prev, summaryMd: newSummaryMd }));

        try {
            await meetingApi.updateMeetingSummary(projectId, summary.id, {
                summary: newSummaryMd,
            });
        } catch (error) {
            console.error('체크 상태 저장 실패:', error);
            // 롤백
            setSummary(prev => ({ ...prev, summaryMd: initialSummary.summaryMd }));
        }
    };

    const handleDeleteClick = async () => {
        setIsDeleting(true);
        try {
            await meetingApi.deleteMeetingSummary(projectId, summary.id);
            setIsDeleteModalOpen(false);
            triggerRefresh();
            onDelete?.(summary.id);
            onClose();
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    // 편집 모드 핸들러
    const handleDiscussionPointChange = (index, value) => {
        const updated = [...editDiscussionPoints];
        updated[index] = value;
        setEditDiscussionPoints(updated);
    };

    const handleEditActionItemTextChange = (index, value) => {
        const updated = editActionItems.map((item, i) =>
            i === index ? { ...item, text: value } : item
        );
        setEditActionItems(updated);
    };

    const handleEditActionItemCheckChange = (index) => {
        const updated = editActionItems.map((item, i) =>
            i === index ? { ...item, checked: !item.checked } : item
        );
        setEditActionItems(updated);
    };

    const handleDownloadPdf = async () => {
        if (!contentRef.current) return;
        try {
            const element = contentRef.current;
            const canvas = await html2canvas(element, {
                scale: 2, // 해상도 높임
                useCORS: true,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    // html2canvas가 인식 못하는 oklch 색상을 브라우저 기본 resolver를 통해 HEX/RGB로 변환
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    const resolveColor = (color) => {
                        if (!color || !color.includes('oklch')) return color;
                        try {
                            ctx.fillStyle = color;
                            return ctx.fillStyle; // 브라우저가 hex 또는 rgb(a)로 변환해줌
                        } catch (e) {
                            return '#000000';
                        }
                    };

                    const elements = clonedDoc.querySelectorAll('*');
                    elements.forEach(el => {
                        const style = window.getComputedStyle(el);

                        // 주요 색상 속성 일괄 변환
                        ['color', 'background-color', 'border-color', 'fill', 'stroke'].forEach(prop => {
                            const val = style.getPropertyValue(prop);
                            if (val && val.includes('oklch')) {
                                el.style.setProperty(prop, resolveColor(val), 'important');
                            }
                        });

                        // 그림자(box-shadow)에 oklch가 포함된 경우 html2canvas가 크래시되므로 제거 또는 변환
                        const shadow = style.getPropertyValue('box-shadow');
                        if (shadow && shadow.includes('oklch')) {
                            el.style.setProperty('box-shadow', 'none', 'important');
                        }
                    });
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210; // A4 가로 (mm)
            const pageHeight = 297; // A4 세로 (mm)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fileName = `${parsed.title || summary.title || '회의록'}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('PDF 생성 실패:', error);
            alert('PDF 생성 중 오류가 발생했습니다.');
        }
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
        } catch {
            return dateString;
        }
    };

    const displayDiscussionPoints = isEditing ? editDiscussionPoints : parsed.discussionPoints;
    const displayActionItems = isEditing ? editActionItems : parsed.actionItems;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            <Rnd
                default={{
                    x: window.innerWidth / 2 - 240,
                    y: window.innerHeight / 2 - 300,
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
                            onClick={handleDownloadPdf}
                        />
                        <IconButton
                            icon={<Trash2 size={16} />}
                            variant="ghost"
                            size="xs"
                            title="삭제"
                            className="on-drag-cancel text-red-500"
                            onClick={() => setIsDeleteModalOpen(true)}
                        />
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
                <div ref={contentRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-white cursor-default">
                    {/* Title & Date */}
                    <div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-2xl font-bold mb-1 focus:outline-blue-500"
                            />
                        ) : (
                            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1 leading-tight">
                                {editTitle || parsed.title || summary.title || '제목 없는 회의'}
                            </h1>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <Calendar size={12} />
                            <span>{formatDate(summary.createdAt)}</span>
                        </div>
                    </div>

                    <Divider className="bg-gray-300" />

                    {/* Discussion Points */}
                    <section>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-2">
                            <List size={16} className="text-green-500" />
                            주요 논의 사항
                        </h3>
                        <ul className="space-y-2 pl-1.5">
                            {displayDiscussionPoints.map((item, index) => (
                                <li key={index} className="flex gap-2.5 text-sm text-[var(--text-secondary)] leading-relaxed">
                                    <span className="text-green-500 mt-1.5 text-[10px]">●</span>
                                    {isEditing ? (
                                        <textarea
                                            value={item}
                                            onChange={(e) => handleDiscussionPointChange(index, e.target.value)}
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
                            {displayActionItems.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => isEditing ? handleEditActionItemCheckChange(index) : handleActionItemCheckToggle(index)}
                                        className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={item.text}
                                            onChange={(e) => handleEditActionItemTextChange(index, e.target.value)}
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
            </Rnd >

            {/* 삭제 확인 모달 */}
            < div className="pointer-events-auto" >
                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDeleteClick}
                    title="회의록 삭제"
                    message="이 회의록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                    confirmText="삭제"
                    cancelText="취소"
                    confirmVariant="danger"
                    isLoading={isDeleting}
                />
            </div >
        </div >,
        document.body
    );
};

export default DraggableSummaryWindow;
