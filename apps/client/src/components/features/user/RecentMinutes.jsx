/**
 * Apple-Style Recent Minutes
 * Card-based layout, clean design
 */
import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { FileText, Calendar, X } from 'lucide-react';

// 임시 데이터
const MOCK_MINUTES = [
  { id: 1, title: '개발회의 - 로그인 버그', date: '2025-01-10', content: '로그인 버그 관련 논의 내용입니다. 세션 만료 시 자동 갱신 로직을 추가하기로 결정했습니다.', channel: '개발팀' },
  { id: 2, title: '개발회의 - UI 개선', date: '2025-01-08', content: 'UI 컴포넌트 통일화 작업 논의. Apple 스타일의 디자인 시스템을 도입하기로 했습니다.', channel: '디자인팀' },
  { id: 3, title: '긴급버그 - 결제 오류', date: '2025-01-09', content: 'PG사 연동 오류 수정 건. API 응답 형식 변경으로 인한 문제였습니다.', channel: '결제팀' },
];

const RecentMinutes = () => {
  const [openedMinute, setOpenedMinute] = useState(null);

  return (
    <div className="w-full">
      {/* 회의록 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_MINUTES.map((minute, index) => (
          <div
            key={minute.id}
            onClick={() => setOpenedMinute(minute)}
            className="
              p-4
              bg-[var(--bg-input)]
              rounded-[var(--radius-xl)]
              border border-[var(--border-subtle)]
              cursor-pointer
              transition-all duration-300
              hover:-translate-y-1
              hover:shadow-[var(--shadow-md)]
              hover:border-[var(--border-strong)]
              group
              animate-fade-up
            "
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* 아이콘 + 채널 */}
            <div className="flex items-center gap-2 mb-3">
              <div className="
                w-8 h-8
                flex items-center justify-center
                rounded-[var(--radius-lg)]
                bg-[var(--success-bg)]
                text-[var(--color-green-primary)]
              ">
                <FileText size={14} />
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">
                {minute.channel}
              </span>
            </div>

            {/* 제목 */}
            <h4 className="text-sm font-semibold text-[var(--text-bright)] mb-2 line-clamp-1 group-hover:text-[var(--color-green-primary)] transition-colors">
              {minute.title}
            </h4>

            {/* 미리보기 */}
            <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-3">
              {minute.content}
            </p>

            {/* 날짜 */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
              <Calendar size={12} />
              {minute.date}
            </div>
          </div>
        ))}
      </div>

      {/* Draggable Modal */}
      {openedMinute && (
        <Rnd
          default={{
            x: window.innerWidth / 2 - 200,
            y: 100,
            width: 450,
            height: 350,
          }}
          minWidth={320}
          minHeight={250}
          bounds="window"
          className="z-50 rounded-[var(--radius-2xl)] shadow-[var(--shadow-2xl)] bg-[var(--bg-panel)] border border-[var(--border-default)] overflow-hidden flex flex-col"
          dragHandleClassName="modal-header"
        >
          {/* 헤더 */}
          <div className="modal-header px-5 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center cursor-move select-none bg-[var(--bg-input)]">
            <div className="flex items-center gap-3">
              <div className="
                w-8 h-8
                flex items-center justify-center
                rounded-[var(--radius-lg)]
                bg-[var(--success-bg)]
                text-[var(--color-green-primary)]
              ">
                <FileText size={14} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--text-bright)] truncate max-w-[280px]">
                  {openedMinute.title}
                </h3>
                <p className="text-xs text-[var(--text-tertiary)]">
                  {openedMinute.channel} · {openedMinute.date}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenedMinute(null);
              }}
              className="
                w-7 h-7
                flex items-center justify-center
                rounded-full
                text-[var(--text-tertiary)]
                hover:bg-[var(--bg-hover)]
                hover:text-[var(--text-bright)]
                transition-all duration-200
              "
            >
              <X size={16} />
            </button>
          </div>

          {/* 내용 */}
          <div className="p-5 overflow-y-auto flex-1 cursor-default scrollbar-thin">
            <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {openedMinute.content}
            </p>
          </div>
        </Rnd>
      )}
    </div>
  );
};

export default RecentMinutes;