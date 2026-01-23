// src/pages/components/RecentMinutes.jsx
import React, { useState } from 'react';
import { Rnd } from 'react-rnd'; // ★ 드래그 & 리사이징 핵심 라이브러리

// 임시 데이터
const MOCK_MINUTES = [
  { id: 1, title: '[2025-01-10] 개발회의.md - 로그인 버그', date: '2025-01-10', content: '로그인 버그 관련 논의 내용입니다...' },
  { id: 2, title: '[2025-01-08] 개발회의.md - UI 개선', date: '2025-01-08', content: 'UI 컴포넌트 통일화 작업 논의...' },
  { id: 3, title: '[2025-01-09] 긴급버그.md - 결제 오류', date: '2025-01-09', content: 'PG사 연동 오류 수정 건...' },
];

const RecentMinutes = () => {
  // 어떤 회의록이 열렸는지 관리 (null이면 닫힘)
  const [openedMinute, setOpenedMinute] = useState(null);

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        📋 최근 회의록
      </h2>

      {/* 회의록 리스트 */}
      <ul className="space-y-2">
        {MOCK_MINUTES.map((minute) => (
          <li 
            key={minute.id}
            onClick={() => setOpenedMinute(minute)}
            className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-lg cursor-pointer transition-colors flex items-center justify-between group"
          >
            <span className="text-sm text-gray-700 truncate font-medium group-hover:text-blue-700">
              {minute.title}
            </span>
          </li>
        ))}
      </ul>

      {/* ★ Draggable Modal (Rnd) 영역 */}
      {openedMinute && (
        <Rnd
          default={{
            x: 100, y: 100, // 초기 위치
            width: 400, height: 300, // 초기 크기
          }}
          minWidth={300}
          minHeight={200}
          bounds="window" // 화면 밖으로 못 나가게
          className="z-50 border rounded-lg shadow-2xl bg-white overflow-hidden flex flex-col"
          dragHandleClassName="modal-header" // 이 클래스를 가진 영역을 잡아야 드래그 됨
        >
          {/* 모달 헤더 (드래그 손잡이) */}
          <div className="modal-header bg-gray-100 p-3 border-b flex justify-between items-center cursor-move select-none">
            <span className="font-bold text-sm text-gray-700 truncate pr-4">
              {openedMinute.title}
            </span>
            {/* 닫기 버튼 (드래그 이벤트 전파 방지) */}
            <button 
              onClick={(e) => {
                e.stopPropagation(); // 중요: 드래그랑 겹치지 않게
                setOpenedMinute(null);
              }}
              className="text-gray-400 hover:text-red-500 cursor-pointer"
            >
              ✖
            </button>
          </div>

          {/* 모달 내용 (여기는 드래그 안됨) */}
          <div className="p-4 overflow-y-auto flex-1 bg-white cursor-default">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {openedMinute.content}
            </p>
            <div className="mt-4 pt-4 border-t text-xs text-gray-400">
               작성일: {openedMinute.date}
            </div>
          </div>
        </Rnd>
      )}
    </div>
  );
};

export default RecentMinutes;