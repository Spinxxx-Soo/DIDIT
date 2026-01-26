import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Hash } from 'lucide-react';
import useMeetingStore from '@/store/useMeetingStore';
import { meetingApi } from '@/api/meeting';

const RECORDING_LIMIT_SECONDS = 60 * 60; // 1시간 = 3600초

const MeetingHeader = () => {
  const { meetingTitle, meetingId, isRecording, setRecording, currentChannelMode } = useMeetingStore();
  const [remainingTime, setRemainingTime] = useState(RECORDING_LIMIT_SECONDS);

  // TODO: 백엔드 연동 시 구현 예정
  // 녹화 종료 후 AI 요약 생성 진행률 표시
  // meetingApi.getSummaryJobStatus(jobId)로 폴링 필요
  // const [summaryProgress, setSummaryProgress] = useState(null);

  // 녹화 중일 때 카운트다운
  useEffect(() => {
    if (!isRecording) {
      setRemainingTime(RECORDING_LIMIT_SECONDS);
      return;
    }

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          // 시간 종료 시 자동 녹화 종료
          handleStopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  // 시간 포맷팅 (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 녹화 시작
  const handleStartRecording = useCallback(async () => {
    try {
      if (meetingId) {
        await meetingApi.startRecording(meetingId);
      }
      setRecording(true);
      setRemainingTime(RECORDING_LIMIT_SECONDS);
    } catch (error) {
      console.error('녹화 시작 실패:', error);
    }
  }, [meetingId, setRecording]);

  // 녹화 종료
  const handleStopRecording = useCallback(async () => {
    try {
      if (meetingId) {
        await meetingApi.stopRecording(meetingId);
      }
      setRecording(false);
    } catch (error) {
      console.error('녹화 종료 실패:', error);
    }
  }, [meetingId, setRecording]);

  // 녹화 토글
  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  return (
    <header
      className="bg-white border-b px-6 py-3 flex items-center justify-between"
      style={{ borderColor: 'var(--border-default)' }}
    >
      {/* 왼쪽: 회의 정보 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {currentChannelMode === 'VOICE' ? (
            <Mic size={18} className="text-[var(--color-green-primary)]" />
          ) : (
            <Hash size={18} className="text-[var(--text-secondary)]" />
          )}
          <span className="font-semibold" style={{ color: 'var(--text-bright)' }}>
            {meetingTitle || '회의'}
          </span>
        </div>

        {/* 녹화 시작/종료 버튼 */}
        <button
          onClick={handleToggleRecording}
          className={`px-4 py-2 rounded-md text-sm font-semibold text-white ${
            isRecording ? 'bg-[var(--color-error)]' : 'bg-[var(--color-green-primary)]'
          }`}
        >
          {isRecording ? '녹화종료' : '녹화시작'}
        </button>

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
      </div>

      {/* 오른쪽: 회의록 생성 상태 & 버튼들 */}
      <div className="flex items-center gap-6">
        {/* TODO: 백엔드 연동 시 구현 예정 - 회의록 생성 진행 상태 */}
        {/* {summaryProgress !== null && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-blue-600">
                회의록 생성중입니다... ({summaryProgress}%)
              </span>
            </div>
          </div>
        )} */}

      </div>
    </header>
  );
};

export default MeetingHeader;
