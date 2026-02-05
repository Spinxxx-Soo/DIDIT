package com.didit.server.service.service;

import com.didit.server.data.entity.MeetingUserEntity;
import com.didit.server.share.result.Result;

public interface MeetingUserService {
    /**
     * Action: MeetingUser에 새로운 로우 추가
     * Input:
     * - long meetingId: meetingId
     * - long userId: userId
     * - String token: 미디어서버 엑세스 토큰
     * Success:
     * - ok()
     * Persistence:
     * - (추가 또는 수정) meetings 테이블에 새로운 레코드 생성
     * Failures:
     * - <404>: 존재하지 않는 projectId
     * - <404>: 존재하지 않는 userId
     */
    Result CreateMeetingUser(Long meetingId, Long userId, String token);

    /**
     * Action: MeetingUser에 JoinedAt 업데이트
     * Input:
     * - String token: 미디어서버 엑세스 토큰
     * Success:
     * - ok()
     * Persistence:
     * - (수정)
     * Failures:
     * - <404>: 존재하지 않는 token
     */
    Result JoinMeeting(String token);

    /**
     * Action: MeetingUser에 LeftAt 업데이트
     * Input:
     * - String token: 미디어서버 엑세스 토큰
     * Success:
     * - ok()
     * Persistence:
     * - (수정)
     * Failures:
     * - <404>: 존재하지 않는 token
     */
    Result leftMeeting(String token);

    Result<MeetingUserEntity> findMeetingUserByToken(String token);


}
