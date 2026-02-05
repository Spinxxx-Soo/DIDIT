import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Input } from '@/components/common/Input/Input'; // Assuming Input component path
import { toast } from '@/store/useToastStore'; // Assuming toast store path
import { projectApi } from '@/api/project';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button';

export const ScheduleDetailModal = ({ isOpen, onClose, schedule, onUpdate }) => {
    const { projectId } = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
    });

    useEffect(() => {
        if (schedule) {
            setEditData({
                title: schedule.title,
                startDate: schedule.startDate,
                endDate: schedule.endDate,
                // rawStartedAt/rawEndedAt이 있다면 사용, 없다면 기본값
                startTime: schedule.rawStartedAt ? schedule.rawStartedAt.split('T')[1].substring(0, 5) : '09:00',
                endTime: schedule.rawEndedAt ? schedule.rawEndedAt.split('T')[1].substring(0, 5) : '10:00',
            });
        }
        setIsEditing(false);
    }, [schedule]);

    const getTypeStyle = (type) => {
        const styles = {
            planning: 'bg-blue-50 text-blue-600 border-blue-100',
            meeting: 'bg-purple-50 text-purple-600 border-purple-100',
            data: 'bg-amber-50 text-amber-600 border-amber-100',
            dev: 'bg-[var(--success-bg)] text-[var(--color-green-primary)] border-[var(--color-green-100)]',
        };
        return styles[type] || styles.meeting;
    };

    const handleDelete = async () => {
        if (!confirm('정말로 이 일정을 삭제하시겠습니까?')) return;

        try {
            await projectApi.deleteChannel(schedule.id);
            toast.success('일정이 삭제되었습니다.');
            onClose();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('삭제 실패:', error);
            toast.error('일정 삭제에 실패했습니다.');
        }
    };

    const handleUpdate = async () => {
        if (!editData.title.trim()) {
            toast.warning('일정 제목을 입력해주세요.');
            return;
        }

        try {
            // 날짜와 시간을 합쳐서 ISO 포맷으로 변환 -> API 스펙에 맞게 조정 필요
            // projectApi.updateChannel은 params로 { title, start, due } 등을 받음 (api/project.js 참고)
            const startDateTime = `${editData.startDate}T${editData.startTime}:00`;
            const endDateTime = `${editData.endDate}T${editData.endTime}:00`;

            await projectApi.updateChannel(schedule.id, {
                title: editData.title,
                start: startDateTime,
                due: endDateTime
            });

            toast.success('일정이 수정되었습니다.');
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('수정 실패:', error);
            toast.error('일정 수정에 실패했습니다.');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "일정 수정" : "일정 상세"}
            size="sm"
            footer={
                <div className="flex gap-2 justify-end w-full">
                    {isEditing ? (
                        <>
                            <Button variant="secondary" onClick={() => setIsEditing(false)}>취소</Button>
                            <Button variant="primary" onClick={handleUpdate}>저장</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="danger" onClick={handleDelete} className="bg-white border-red-200 text-red-500 hover:bg-red-50">삭제</Button>
                            <Button variant="secondary" onClick={() => setIsEditing(true)}>수정</Button>
                            <Button variant="primary" onClick={onClose}>확인</Button>
                        </>
                    )}
                </div>
            }
        >
            {schedule && (
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">일정 내용</label>
                        {isEditing ? (
                            <Input
                                value={editData.title}
                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                autoFocus
                            />
                        ) : (
                            <div className="text-[var(--text-primary)] font-medium text-lg breaking-keep">{schedule.title}</div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">시작</label>
                            {isEditing ? (
                                <div className="flex flex-col gap-1">
                                    <Input
                                        type="date"
                                        value={editData.startDate}
                                        onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                                    />
                                    <Input
                                        type="time"
                                        value={editData.startTime}
                                        onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div className="text-[var(--text-secondary)]">
                                    {schedule.startDate} <span className="text-xs text-[var(--text-tertiary)] ml-1">
                                        {schedule.rawStartedAt ? schedule.rawStartedAt.split('T')[1].substring(0, 5) : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">종료</label>
                            {isEditing ? (
                                <div className="flex flex-col gap-1">
                                    <Input
                                        type="date"
                                        value={editData.endDate}
                                        onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                                    />
                                    <Input
                                        type="time"
                                        value={editData.endTime}
                                        onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div className="text-[var(--text-secondary)]">
                                    {schedule.endDate} <span className="text-xs text-[var(--text-tertiary)] ml-1">
                                        {schedule.rawEndedAt ? schedule.rawEndedAt.split('T')[1].substring(0, 5) : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {!isEditing && (
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">타입</label>
                            <div className={`inline-block px-2 py-0.5 rounded text-xs border ${getTypeStyle(schedule.type)}`}>
                                {schedule.type}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};
