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
import { ScheduleDetailModal } from './ScheduleDetailModal';

const WeeklySchedule = () => {
  const { projectId } = useParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
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
      // [수정] 조회 시에도 toISOString() 대신 로컬 시간 형식을 사용하여
      // 서버가 정확한 범위 내의 데이터를 조회할 수 있도록 함.
      const startStr = format(startDate, "yyyy-MM-dd'T'HH:mm:ss");
      const endStr = format(endOfWeek(currentDate), "yyyy-MM-dd'T'HH:mm:ss");

      const response = await meetingApi.getMeetingsByDate(projectId, startStr, endStr);

      // [수정 2] API 응답 필드명(startedAt, endedAt)에 맞춰 매핑 변경
      const mappedSchedules = (response.data || []).map(item => ({
        id: item.id || Math.random(),
        title: item.title,
        startDate: item.startedAt ? item.startedAt.split('T')[0] : '',
        endDate: item.endedAt ? item.endedAt.split('T')[0] : '',
        // [추가됨] 중복 검사를 위해 원본 시간 데이터(ISO String)도 저장
        rawStartedAt: item.startedAt,
        rawEndedAt: item.endedAt,
        type: item.mode === 'CHAT' ? 'meeting' : 'planning',
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

  const getSchedulesForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const now = new Date();

    return schedules.filter(s => {
      // 기본 날짜 범위 체크
      const isInDateRange = s.startDate <= dateStr && dateStr <= s.endDate;
      if (!isInDateRange) return false;

      // SCHEDULED 상태인데 시작 시간이 지났으면 캘린더에서 숨김
      // (이미 사이드바에 채널로 표시되고 있음)
      if (s.type === 'meeting' && s.rawStartedAt) {
        const startTime = new Date(s.rawStartedAt);
        if (startTime <= now) {
          return false; // 시작 시간이 지난 예약 일정은 숨김
        }
      }

      return true;
    });
  };

  const handleOpenModal = (dateStr = '') => {
    // 기본값: 현재 시간 기준 다음 정각 시간
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0); // 다음 시간 정각 (분, 초 0)

    // 종료 시간은 1시간 뒤
    const nextHourEnd = new Date(nextHour);
    nextHourEnd.setHours(nextHour.getHours() + 1);

    const todayStr = format(now, 'yyyy-MM-dd');
    const targetDateStr = dateStr || todayStr;

    setNewSchedule({
      title: '',
      startDate: targetDateStr,
      endDate: targetDateStr,
      startTime: format(nextHour, 'HH:mm'),
      endTime: format(nextHourEnd, 'HH:mm'),
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

    // 현재 시간과 비교 (과거 시간 예약 방지)
    if (startDateTime <= new Date()) {
      toast.warning('시작 시간은 현재 시간보다 이후여야 합니다.');
      return;
    }

    if (startDateTime >= endDateTime) {
      toast.warning('종료 시간은 시작 시간보다 이후여야 합니다.');
      return;
    }

    // [추가됨] 일정 중복 검사
    const hasOverlap = schedules.some(existing => {
      // 본인이 아닌 다른 일정들과 비교 (수정 기능이 추가될 경우를 대비해 id 비교 추가 가능하나 현재는 생성만 있으므로 생략)
      if (!existing.rawStartedAt || !existing.rawEndedAt) return false;

      const existingStart = new Date(existing.rawStartedAt);
      const existingEnd = new Date(existing.rawEndedAt);

      // 교차 여부 확인: (일정A 시작 < 일정B 종료) && (일정A 종료 > 일정B 시작)
      return startDateTime < existingEnd && endDateTime > existingStart;
    });

    if (hasOverlap) {
      toast.warning('해당 시간에 이미 다른 일정이 존재합니다.');
      return;
    }

    try {
      // 로컬 시간 그대로 전송 (yyyy-MM-ddTHH:mm:ss)
      const formattedStart = format(startDateTime, "yyyy-MM-dd'T'HH:mm:ss");
      const formattedEnd = format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss");

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
      // 403 Forbidden 에러인 경우 권한 메시지 표시
      if (error.response?.status === 403) {
        toast.error('채널을 예약할 권한이 없습니다.');
      } else {
        toast.error('일정 추가에 실패했습니다. (시간을 확인해주세요)');
      }
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
          const daySchedules = getSchedulesForDay(day);
          const isToday = isSameDay(day, new Date());
          const isSunday = day.getDay() === 0;
          const isSaturday = day.getDay() === 6;
          const dayStr = format(day, 'yyyy-MM-dd');

          return (
            <div
              key={day.toString()}
              onClick={() => handleOpenModal(dayStr)}
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

              {/* [변경됨] 하나의 날짜에 여러 일정이 있을 수 있으므로 배열(daySchedules)을 순회하며 모두 표시합니다. */}
              {/* [추가됨] max-h-[140px] overflow-y-auto: 일정이 많아지면 스크롤하여 볼 수 있게 함 (약 5개 정도 높이) */}
              <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                {daySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    onClick={(e) => {
                      e.stopPropagation(); // 부모의 날짜 클릭 이벤트(생성 모달)가 발생하지 않도록 중단
                      setSelectedSchedule(schedule); // [추가됨] 클릭 시 상세 정보를 보기 위해 선택된 일정을 상태에 저장
                    }}
                    className={`
                        text-xs px-2 py-1.5 rounded-[var(--radius-md)] font-medium truncate border cursor-pointer hover:opacity-80 flex-shrink-0
                        ${getTypeStyle(schedule.type)}
                      `}
                  >
                    {schedule.title}
                  </div>
                ))}
              </div>

              {daySchedules.length === 0 && (
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

        </div>
      </Modal>

      {/* 일정 상세 모달 */}
      <ScheduleDetailModal
        isOpen={!!selectedSchedule}
        onClose={() => setSelectedSchedule(null)}
        schedule={selectedSchedule}
        onUpdate={fetchSchedules}
      />
    </div>
  );
};

export default WeeklySchedule;