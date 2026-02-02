/**
 * Apple-Style Recent Minutes
 * Card-based layout, clean design
 */
import React, { useState } from 'react';
import { FileText, Calendar } from 'lucide-react';
import DraggableSummaryWindow from '@/components/features/meeting/DraggableSummaryWindow';

// 임시 데이터 (AiSummaryModal 형식에 맞춤)
const MOCK_MINUTES = [
  {
    id: 1,
    title: '개발회의 - 로그인 버그',
    date: '2025-01-10T10:00:00',
    channel: '개발팀',
    content: [
      '로그인 세션 만료 시 자동 갱신 로직이 실패하는 문제 확인',
      'Refresh Token의 만료 시간을 2주로 연장하기로 결정',
      '클라이언트 측 인터셉터에서 401 에러 처리를 보강하기로 함'
    ],
    actionItems: [
      { id: 1, text: 'Refresh Token 만료 시간 설정 변경', checked: false },
      { id: 2, text: 'Axios 인터셉터 로직 수정', checked: true }
    ]
  },
  {
    id: 2,
    title: '개발회의 - UI 개선',
    date: '2025-01-08T14:30:00',
    channel: '디자인팀',
    content: [
      '전체적인 UI 디자인 시스템을 Apple 스타일로 통일하기로 함',
      '버튼, 카드, 모달 등의 Radius를 키우고 그림자 효과를 부드럽게 적용',
      '폰트는 Pretendard Variable을 사용하며 가독성을 높임'
    ],
    actionItems: [
      { id: 1, text: '공통 컴포넌트 스타일 업데이트', checked: false },
      { id: 2, text: 'Lounge 페이지 디자인 시안 적용', checked: true }
    ]
  },
  {
    id: 3,
    title: '긴급버그 - 결제 오류',
    date: '2025-01-09T09:15:00',
    channel: '결제팀',
    content: [
      'PG사 연동 시 간헐적으로 결제 승인이 누락되는 현상 발견',
      'API 응답 지연으로 인한 타임아웃 처리가 원인으로 파악됨',
      '타임아웃 설정을 30초에서 60초로 늘리고 재시도 로직 추가'
    ],
    actionItems: [
      { id: 1, text: 'PG사 API 타임아웃 설정 변경', checked: true },
      { id: 2, text: '결제 실패 시 재시도 모달 구현', checked: false }
    ]
  },
];

const RecentMinutes = () => {
  const [openedMinute, setOpenedMinute] = useState(null);

  return (
    <div className="w-full">
      {/* 회의록 카드 그리드 - 전체 너비 반응형 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

            {/* 미리보기 (첫 번째 항목) */}
            <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-3">
              {minute.content[0]}
            </p>

            {/* 날짜 */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
              <Calendar size={12} />
              {new Date(minute.date).toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        ))}
      </div>

      {/* DraggableSummaryWindow 사용 (사이드바와 동일) */}
      <DraggableSummaryWindow
        isOpen={!!openedMinute}
        onClose={() => setOpenedMinute(null)}
        summary={openedMinute}
      />
    </div>
  );
};

export default RecentMinutes;