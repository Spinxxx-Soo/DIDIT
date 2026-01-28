import { useState, useCallback, useRef, useEffect } from 'react';
import useMeetingStore from '@/store/useMeetingStore';
import { meetingApi } from '@/api/meeting';

const RECORDING_LIMIT_SECONDS = 60 * 60; // 1시간 (3600초)

const useStt = () => {
    const {
        isRecording,
        setRecording,
        meetingId
    } = useMeetingStore();

    const [remainingTime, setRemainingTime] = useState(RECORDING_LIMIT_SECONDS);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedSummary, setGeneratedSummary] = useState(null);
    const [error, setError] = useState(null);

    const timerRef = useRef(null);

    // 타이머 로직
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => {
                setRemainingTime((prev) => {
                    if (prev <= 1) {
                        stopRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setRemainingTime(RECORDING_LIMIT_SECONDS);
        }

        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    // 녹화 시작
    const startRecording = useCallback(async () => {
        if (!meetingId) return;
        try {
            setError(null);
            await meetingApi.startRecording(meetingId);
            setRecording(true);
            setRemainingTime(RECORDING_LIMIT_SECONDS);
        } catch (err) {
            console.error('녹화 시작 실패:', err);
            setError('녹화를 시작할 수 없습니다.');
        }
    }, [meetingId, setRecording]);

    // 녹화 종료 및 요약 생성 트리거
    const stopRecording = useCallback(async () => {
        if (!meetingId) return;
        try {
            await meetingApi.stopRecording(meetingId);
            setRecording(false);

            // 요약 생성 시작
            setIsGenerating(true);
            try {
                const response = await meetingApi.createSummary(meetingId);
                setGeneratedSummary(response.data);
            } catch (err) {
                console.error('요약 생성 실패:', err);
                setError('요약 생성에 실패했습니다.');
            } finally {
                setIsGenerating(false);
                // 모달 열기 로직은 컴포넌트 레벨에서 generatedSummary 상태를 감지하여 처리
            }

        } catch (err) {
            console.error('녹화 종료 실패:', err);
            setError('녹화를 종료할 수 없습니다.');
        }
    }, [meetingId, setRecording]);

    // 시간 포맷팅 헬퍼
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return {
        isRecording,
        remainingTime,
        formatTime,
        startRecording,
        stopRecording,
        isGenerating,
        generatedSummary,
        setGeneratedSummary, // 모달 닫을 때 초기화용
        error
    };
};

export default useStt;
