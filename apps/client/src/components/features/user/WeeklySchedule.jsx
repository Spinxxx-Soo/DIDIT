import React, { useState } from 'react';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input/Input';
import { toast } from '@/store/useToastStore';

// 임시 데이터 (나중에 API 연동)
// 임시 데이터 (나중에 API 연동)
const INITIAL_SCHEDULES = [
  { id: 1, startDate: '2026-01-23', endDate: '2026-01-23', title: '기획 구상 및 마무리', type: 'planning' },
  { id: 2, startDate: '2026-01-25', endDate: '2026-01-25', title: '데이터 수집 및 전처리', type: 'data' },
];

const WeeklySchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    startDate: '',
    endDate: '',
    type: 'planning', // planning | data | meeting | etc
  });

  // 이번 주의 시작(일요일)과 끝(토요일) 구하기
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); // 0: 일요일 시작
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  // 날짜 매칭 함수
  const getScheduleForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.find(s => {
      // 단순히 문자열 비교 (YYYY-MM-DD 포맷이므로 가능)
      return s.startDate <= dateStr && dateStr <= s.endDate;
    });
  };

  // 모달 열기
  const handleOpenModal = (dateStr = '') => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setNewSchedule({
      title: '',
      startDate: dateStr || today,
      endDate: dateStr || today,
      type: 'planning',
    });
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 일정 저장
  const handleSaveSchedule = () => {
    if (!newSchedule.title || !newSchedule.startDate || !newSchedule.endDate) {
      toast.warning('일정 제목과 날짜를 입력해주세요.');
      return;
    }

    if (newSchedule.startDate > newSchedule.endDate) {
      toast.warning('종료 날짜는 시작 날짜보다 빠를 수 없습니다.');
      return;
    }

    const newId = Math.max(...schedules.map(s => s.id), 0) + 1;
    const item = {
      id: newId,
      ...newSchedule,
    };

    setSchedules([...schedules, item]);
    toast.success('일정이 추가되었습니다.');
    handleCloseModal();
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* 1. 헤더: 타이틀 & 주간 이동 컨트롤러 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
          📅 이번 주 일정
          <button
            onClick={() => handleOpenModal()}
            className="text-gray-400 hover:text-blue-600 text-lg transition-colors"
          >
            +
          </button>
        </h2>

        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-1 py-1 shadow-sm">
          <button onClick={handlePrevWeek} className="p-1 hover:bg-gray-100 rounded text-gray-600">
            &lt;
          </button>
          <span className="mx-3 text-sm font-semibold text-gray-700 min-w-[100px] text-center">
            {format(startDate, 'M/d')} - {format(endOfWeek(currentDate), 'M/d')}
          </span>
          <button onClick={handleNextWeek} className="p-1 hover:bg-gray-100 rounded text-gray-600">
            &gt;
          </button>
        </div>
      </div>

      {/* 2. 달력 그리드 */}
      <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex-1 min-h-[120px]">
        {weekDays.map((day) => {
          const schedule = getScheduleForDay(day);
          const isToday = isSameDay(day, new Date());
          const isSunday = day.getDay() === 0;
          const isSaturday = day.getDay() === 6;
          const dayStr = format(day, 'yyyy-MM-dd');

          return (
            <div
              key={day.toString()}
              className={`flex-1 border-r last:border-r-0 flex flex-col group relative transition-colors border-gray-100
                ${isToday ? 'bg-blue-50/40' : 'bg-white'}
              `}
            >
              {/* 날짜 헤더 */}
              <div className={`
                text-center py-2 text-sm font-medium border-b border-gray-100
                ${isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-500'}
                ${isToday ? 'font-bold' : ''}
              `}>
                {format(day, 'EEE (M/d)', { locale: ko })}
              </div>

              {/* 일정 표시 영역 */}
              <div className="p-2 flex-1 flex flex-col gap-1">
                {schedule && (
                  <div className={`
                    text-xs px-2 py-1.5 rounded-md font-medium truncate shadow-sm cursor-pointer hover:opacity-80 transition-opacity
                    ${schedule.type === 'planning'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : schedule.type === 'meeting'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-green-100 text-green-700 border border-green-200'}
                  `}>
                    {schedule.title}
                  </div>
                )}

                {/* 호버 시 + 버튼 */}
                <button
                  onClick={() => handleOpenModal(dayStr)}
                  className="opacity-0 group-hover:opacity-100 absolute bottom-2 right-2 text-gray-300 hover:text-blue-500 text-xs p-1"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. 일정 추가 모달 */}
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
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="시작 날짜"
                type="date"
                value={newSchedule.startDate}
                onChange={(e) => setNewSchedule({ ...newSchedule, startDate: e.target.value })}
                size="md"
              />
            </div>
            <div className="flex-1">
              <Input
                label="종료 날짜"
                type="date"
                value={newSchedule.endDate}
                onChange={(e) => setNewSchedule({ ...newSchedule, endDate: e.target.value })}
                size="md"
              />
            </div>
          </div>
          <Input
            label="일정 내용"
            placeholder="할 일을 입력하세요"
            value={newSchedule.title}
            onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
            size="md"
          />
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-[var(--text-primary)]">유형</label>
            <select
              className="
                w-full h-10 px-4 text-[14px] 
                bg-[var(--bg-input)] 
                border border-[var(--border-default)] 
                rounded-[var(--radius-md)] 
                text-[var(--text-primary)]
                focus:outline-none focus:border-[var(--color-green-primary)] focus:ring-3 focus:ring-[var(--color-green-primary)]/20 
                transition-all duration-200
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