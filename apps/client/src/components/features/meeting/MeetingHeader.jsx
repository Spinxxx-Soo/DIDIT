import React from 'react';
import { Mic, Hash } from 'lucide-react';
import useMeetingStore from '@/store/useMeetingStore';
import useStt from '@/hooks/useStt';

const MeetingHeader = () => {
  const { meetingTitle, currentChannelMode } = useMeetingStore();

  const {
    isRecording,
    remainingTime,
    formatTime,
    startRecording,
    stopRecording,
    isGenerating,
    error
  } = useStt();

  // 녹화 토글
  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const isVoiceChannel = currentChannelMode === 'VOICE';

  return (
    <header
      className="bg-white border-b px-6 py-3 flex items-center justify-between"
      style={{ borderColor: 'var(--border-default)' }}
    >
      {/* 왼쪽: 회의 정보 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {isVoiceChannel ? (
            <Mic size={18} className="text-[var(--color-green-primary)]" />
          ) : (
            <Hash size={18} className="text-[var(--text-secondary)]" />
          )}
          <span className="font-semibold" style={{ color: 'var(--text-bright)' }}>
            {meetingTitle || '회의'}
          </span>
        </div>

        {/* 녹화 시작/종료 버튼 (음성 채널에서만 활성화) */}
        {isVoiceChannel && (
          <button
            onClick={handleToggleRecording}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors ${isRecording
              ? 'bg-[var(--color-error)] hover:bg-red-600'
              : 'bg-[var(--color-green-primary)] hover:bg-emerald-600'
              } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRecording ? '녹화종료' : '녹화시작'}
          </button>
        )}

        {/* 녹화 중일 때만 남은 시간 표시 */}
        {isRecording && (
          <>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              남은 시간 : {formatTime(remainingTime)}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-500">녹화 중</span>
            </div>
          </>
        )}

        {/* 에러 메시지 */}
        {error && (
          <span className="text-sm text-red-500">{error}</span>
        )}
      </div>

      {/* 오른쪽: 회의록 생성 상태 */}
      <div className="flex items-center gap-6">
        {isGenerating && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-blue-600">
              회의록 생성중입니다...
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default MeetingHeader;
