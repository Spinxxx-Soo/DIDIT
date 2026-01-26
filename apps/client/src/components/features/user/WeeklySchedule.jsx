import React, { useState } from 'react';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';

// 임시 데이터 (나중에 API 연동)
const MOCK_SCHEDULES = [
  { id: 1, date: '2026-01-23', title: '기획 구상 및 마무리', type: 'planning' }, // 오늘 날짜로 테스트해보세요
  { id: 2, date: '2026-01-25', title: '데이터 수집 및 전처리', type: 'data' },
];

const WeeklySchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 이번 주의 시작(일요일)과 끝(토요일) 구하기
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); // 0: 일요일 시작
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  // 날짜 매칭 함수
  const getScheduleForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // 실제로는 배열 전체를 순회하거나, 해당 날짜의 여러 일정을 필터링해야 할 수 있습니다.
    return MOCK_SCHEDULES.find(s => s.date === dateStr);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* 1. 헤더: 타이틀 & 주간 이동 컨트롤러 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
          📅 이번 주 일정
          <button className="text-gray-400 hover:text-blue-600 text-lg transition-colors">+</button>
        </h2>

        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-1 py-1 shadow-sm">
          <button onClick={handlePrevWeek} className="p-1 hover:bg-gray-100 rounded text-gray-600">
            &lt; {/* 아이콘으로 대체 가능 */}
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
                      : 'bg-green-100 text-green-700 border border-green-200'}
                  `}>
                    {schedule.title}
                  </div>
                )}

                {/* 호버 시 + 버튼 (선택사항) */}
                <button className="opacity-0 group-hover:opacity-100 absolute bottom-2 right-2 text-gray-300 hover:text-blue-500 text-xs">
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklySchedule;