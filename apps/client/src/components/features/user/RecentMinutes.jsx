/**
 * Apple-Style Recent Minutes
 * Card-based layout, clean design
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Calendar } from 'lucide-react';
import DraggableSummaryWindow from '@/components/features/meeting/DraggableSummaryWindow';
import { loungeApi } from '@/api/lounge';

const RecentMinutes = () => {
  const { projectId } = useParams();
  const [minutes, setMinutes] = useState([]);
  const [openedMinute, setOpenedMinute] = useState(null);

  useEffect(() => {
    const fetchMinutes = async () => {
      if (!projectId) return;
      try {
        const response = await loungeApi.getRecentMinutes(projectId);
        if (Array.isArray(response.data)) {
          setMinutes(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch recent minutes:', error);
      }
    };

    fetchMinutes();
  }, [projectId]);

  return (
    <div className="w-full">
      {/* 회의록 카드 그리드 - 전체 너비 반응형 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {minutes.length === 0 ? (
          <div className="col-span-full py-10 text-center text-[var(--text-tertiary)] border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-xl)]">
            최근 작성된 회의록이 없습니다.
          </div>
        ) : (
          minutes.map((minute, index) => (
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
                  {minute.channel || '공통'}
                </span>
              </div>

              {/* 제목 */}
              <h4 className="text-sm font-semibold text-[var(--text-bright)] mb-2 line-clamp-1 group-hover:text-[var(--color-green-primary)] transition-colors">
                {minute.title}
              </h4>

              {/* 미리보기 (첫 번째 항목) */}
              <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-3">
                {Array.isArray(minute.content) ? minute.content[0] : (minute.summary || '내용 없음')}
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
          ))
        )}
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