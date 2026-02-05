import { useState, useCallback, useRef, useEffect } from 'react';
import useMeetingStore from '@/store/useMeetingStore';
import { meetingApi } from '@/api/meeting';

const RECORDING_LIMIT_SECONDS = 60 * 60; // 1시간 (3600초)

const useStt = () => {
    const {
        isRecording,
        setRecording,
        currentChannelId,
        recordId,
        setRecordId,
        isGenerating,
        setGenerating,
    } = useMeetingStore();

    const [remainingTime, setRemainingTime] = useState(RECORDING_LIMIT_SECONDS);
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
        if (!currentChannelId) return;
        try {
            setError(null);
            const response = await meetingApi.startRecording(currentChannelId);
            setRecordId(response.data);
            setRecording(true);
            setRemainingTime(RECORDING_LIMIT_SECONDS);
        } catch (err) {
            console.error('녹화 시작 실패:', err);
            setError('녹화를 시작할 수 없습니다.');
        }
    }, [currentChannelId, setRecording, setRecordId]);

    // 녹화 종료 (회의록 생성은 서버에서 비동기 처리 → SSE로 완료 수신)
    const stopRecording = useCallback(async () => {
        if (!currentChannelId || !recordId) return;
        try {
            await meetingApi.stopRecording(currentChannelId, recordId);
            setRecording(false);
            setRecordId(null);
            setGenerating(true);
        } catch (err) {
            console.error('녹화 종료 실패:', err);
            setError('녹화를 종료할 수 없습니다.');
        }
    }, [currentChannelId, recordId, setRecording, setRecordId, setGenerating]);

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
        error
    };
};

export default useStt;
