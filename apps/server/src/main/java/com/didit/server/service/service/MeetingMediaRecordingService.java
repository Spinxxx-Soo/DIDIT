package com.didit.server.service.service;

import com.didit.server.data.entity.MeetingRecordEntity;
import com.didit.server.service.command.UpdateRecordingCommand;
import com.didit.server.share.result.Result;

public interface MeetingMediaRecordingService {
    /**
     * Action: meeting의 녹화를 시작함
     * Input:
     * - Long meetingId: meeting ID
     * - Long userId: 시작한 유저 Id
     * Success:
     * - ok(Long MeetingRecordId)
     * Persistence:
     * - (수정)
     * Failures:
     * - <404>: 존재하지 않는 meetingId
     * - <404>: 존재하지 않는 userId
     */
    Result<Long> StartRecording(Long meetingId, Long userId);

    /**
     * Action: meeting의 녹화를 중단함
     * Input:
     * - Long meetingRecordId: meeting record ID
     * Success:
     * - ok()
     * Persistence:
     * - (수정)
     * Failures:
     * - <404>: 존재하지 않는 meetingRecordId
     */
    Result StopRecording(Long meetingRecordId);

    /**
     * Action: meeting의 상태를 업데이트함
     * Input:
     * - Long meetingRecordId: meeting record ID
     * Success:
     * - ok()
     * Persistence:
     * - (수정)
     * Failures:
     * - <404>: 존재하지 않는 meetingRecordId
     */
    Result UpdateRecording(Long meetingRecordId, UpdateRecordingCommand updateRecordingCommand);

    /**
     * Action: meeting를 sessionId로 찾음
     * Input:
     * - Long sessionId: meeting record session ID
     * Success:
     * - ok()
     * Persistence:
     * - (수정)
     * Failures:
     * - <404>: 존재하지 않는 sessionId
     */
    Result<MeetingRecordEntity> findMeetingRecordBySessionId(String sessionId);

    /**
     * Action: meeting의 다운로드 링크를 찾음
     * Input:
     * - Long meetingRecordId: meeting record ID
     * Success:
     * - ok()
     * Persistence:
     * - (수정)
     * Failures:
     * - <404>: 존재하지 않는 meetingRecordId
     * - <500>: 오픈비두 클라이언트 오류
     */
    Result<String> findDownloadURL(Long meetingRecordId);
}
