package com.didit.server.service.service;

import com.didit.server.share.result.Result;

public interface MeetingUserService {
    /**
     * Action: MeetingUser에 새로운 로우 추가 또는 존재하면 token 업데이트 및 joinedAT 업데이트
     * Input:
     * - long meetingId: meetingId
     * - long userId: userId
     * - String token: 미디어서버 엑세스 토큰
     * Success:
     * - ok()
     * Auth/Permission:
     * - (프로젝트 멤버이어야)
     * Persistence:
     * - (추가 또는 수정) meetings 테이블에 새로운 레코드 생성
     * Failures:
     * - <404>: 존재하지 않는 projectId
     * - <404>: 존재하지 않는 userId
     * - <403>: 해당 프로젝트에 권한이 없는 사용자
     */
    Result joinMeeting(Long meetingId, Long userId, String token);

    /**
     * Action: MeetingUser에 LeftAt 업데이트
     * Input:
     * - long meetingId: meetingId
     * - long userId: userId
     * Success:
     * - ok()
     * Persistence:
     * - (수정)
     * Failures:
     * - <404>: 존재하지 않는 projectId
     * - <404>: 존재하지 않는 userId
     * - <404>: 존재하지 않는 meetingUser - name userId, value userId
     */
    Result leftMeeting(Long meetingId, Long userId);
}
