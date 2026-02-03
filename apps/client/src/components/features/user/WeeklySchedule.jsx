import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useParams } from 'react-router-dom';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input/Input';
import { toast } from '@/store/useToastStore';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { meetingApi } from '@/api/meeting';

const WeeklySchedule = () => {
  const { projectId } = useParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'planning',
  });

  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  // 일정 목록 불러오기
  const fetchSchedules = async () => {
    if (!projectId) return;

    try {
      // [수정 1] API 명세(date-time)에 맞춰 ISO String으로 변환
      const startStr = startDate.toISOString();
      const endStr = endOfWeek(currentDate).toISOString();

      const response = await meetingApi.getMeetingsByDate(projectId, startStr, endStr);

      // [수정 2] API 응답 필드명(startedAt, endedAt)에 맞춰 매핑 변경
      const mappedSchedules = (response.data || []).map(item => ({
        id: item.id || Math.random(),
        title: item.title,
        startDate: item.startedAt ? item.startedAt.split('T')[0] : '', // start -> startedAt
        endDate: item.endedAt ? item.endedAt.split('T')[0] : '',       // end -> endedAt
        type: item.mode === 'CHAT' ? 'meeting' : 'planning', // 명세에 type 없으므로 임의 매핑 (필요 시 수정)
      }));

      setSchedules(mappedSchedules);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [currentDate, projectId]);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  const getScheduleForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.find(s => s.startDate <= dateStr && dateStr <= s.endDate);
  };

  const handleOpenModal = (dateStr = '') => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setNewSchedule({
      title: '',
      startDate: dateStr || today,
      endDate: dateStr || today,
      startTime: '09:00',
      endTime: '10:00',
      type: 'planning',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveSchedule = async () => {
    if (!newSchedule.title || !newSchedule.startDate || !newSchedule.endDate) {
      toast.warning('일정 제목과 날짜를 입력해주세요.');
      return;
    }

    if (newSchedule.title.length > 50) {
      toast.warning('일정 제목은 50자 이내여야 합니다.');
      return;
    }

    const startDateTime = new Date(`${newSchedule.startDate}T${newSchedule.startTime}`);
    const endDateTime = new Date(`${newSchedule.endDate}T${newSchedule.endTime}`);

    if (startDateTime > endDateTime) {
      toast.warning('종료 날짜는 시작 날짜보다 빠를 수 없습니다.');
      return;
    }

    try {
      const formattedStart = startDateTime.toISOString();
      const formattedEnd = endDateTime.toISOString();

      await meetingApi.bookMeeting(projectId, {
        title: newSchedule.title,
        start: formattedStart,
        end: formattedEnd,
      });

      toast.success('일정이 추가되었습니다.');
      handleCloseModal();
      fetchSchedules();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast.error('일정 추가에 실패했습니다.');
    }
  };

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
    <div className="w-full flex flex-col">
      {/* 헤더: 주간 네비게이션 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevWeek}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-input)] transition-all duration-200"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="text-[15px] font-semibold text-[var(--text-bright)] min-w-[120px] text-center">
            {format(startDate, 'M월 d일')} - {format(endOfWeek(currentDate), 'M월 d일')}
          </span>

          <button
            onClick={handleNextWeek}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-input)] transition-all duration-200"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--color-green-primary)] bg-[var(--success-bg)] rounded-full border border-[var(--color-green-100)] transition-all duration-200 hover:shadow-[var(--shadow-glow)]"
        >
          <Plus size={14} />
          일정 추가
        </button>
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const schedule = getScheduleForDay(day);
          const isToday = isSameDay(day, new Date());
          const isSunday = day.getDay() === 0;
          const isSaturday = day.getDay() === 6;
          const dayStr = format(day, 'yyyy-MM-dd');

          return (
            <div
              key={day.toString()}
              onClick={() => !schedule && handleOpenModal(dayStr)}
              className={`
                relative p-3 rounded-[var(--radius-xl)] border min-h-[100px] cursor-pointer transition-all duration-200 group animate-fade-up
                ${isToday
                  ? 'bg-[var(--success-bg)] border-[var(--color-green-200)]'
                  : 'bg-[var(--bg-input)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]'
                }
              `}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className={`
                text-sm font-medium mb-2
                ${isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-[var(--text-secondary)]'}
                ${isToday ? 'text-[var(--color-green-primary)] font-bold' : ''}
              `}>
                <span className="block text-xs opacity-70">
                  {format(day, 'EEE', { locale: ko })}
                </span>
                <span className={`
                  inline-flex items-center justify-center w-7 h-7 rounded-full
                  ${isToday ? 'bg-[var(--color-green-primary)] text-white' : ''}
                `}>
                  {format(day, 'd')}
                </span>
              </div>

              {schedule && (
                <div className={`
                  text-xs px-2 py-1.5 rounded-[var(--radius-md)] font-medium truncate border
                  ${getTypeStyle(schedule.type)}
                `}>
                  {schedule.title}
                </div>
              )}

              {!schedule && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Plus size={16} className="text-[var(--text-tertiary)]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 일정 추가 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="일정 추가"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>취소</Button>
            <Button variant="primary" onClick={handleSaveSchedule}>저장</Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="시작 날짜"
              type="date"
              value={newSchedule.startDate}
              onChange={(e) => setNewSchedule({ ...newSchedule, startDate: e.target.value })}
            />
            <Input
              label="시작 시간"
              type="time"
              value={newSchedule.startTime}
              onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
            />
            <Input
              label="종료 날짜"
              type="date"
              value={newSchedule.endDate}
              onChange={(e) => setNewSchedule({ ...newSchedule, endDate: e.target.value })}
            />
            <Input
              label="종료 시간"
              type="time"
              value={newSchedule.endTime}
              onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
            />
          </div>
          <Input
            label="일정 내용"
            placeholder="할 일을 입력하세요"
            value={newSchedule.title}
            onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
          />
          <div className="flex flex-col gap-2.5">
            <label className="text-[14px] font-medium text-[var(--text-primary)]">유형</label>
            <select
              className="
                w-full h-12 px-5 text-[14px] bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-xl)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-green-primary)] focus:ring-4 focus:ring-[var(--color-green-primary)]/10 transition-all duration-200
              "
              value={newSchedule.type}
              onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value })}
            >
              <option value="planning">기획</option>
              <option value="data">자료조사</option>
              <option value="meeting">회의</option>
              <option value="dev">개발</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WeeklySchedule;