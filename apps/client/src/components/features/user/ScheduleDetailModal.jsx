import React from 'react';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button';

export const ScheduleDetailModal = ({ isOpen, onClose, schedule }) => {
    const getTypeStyle = (type) => {
        const styles = {
            planning: 'bg-blue-50 text-blue-600 border-blue-100',
            meeting: 'bg-purple-50 text-purple-600 border-purple-100',
            data: 'bg-amber-50 text-amber-600 border-amber-100',
            dev: 'bg-[var(--success-bg)] text-[var(--color-green-primary)] border-[var(--color-green-100)]',
        };
        return styles[type] || styles.meeting;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="일정 상세"
            size="sm"
            footer={
                <Button variant="secondary" onClick={onClose}>닫기</Button>
            }
        >
            {schedule && (
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">일정 내용</label>
                        <div className="text-[var(--text-primary)] font-medium text-lg">{schedule.title}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">시작</label>
                            <div className="text-[var(--text-secondary)]">{schedule.startDate}</div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">종료</label>
                            <div className="text-[var(--text-secondary)]">{schedule.endDate}</div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 block">타입</label>
                        <div className={`inline-block px-2 py-0.5 rounded text-xs border ${getTypeStyle(schedule.type)}`}>
                            {schedule.type}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};
