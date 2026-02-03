package com.didit.server.service.service;

import com.didit.server.data.entity.UserEntity;
import com.didit.server.share.result.Result;

import java.util.List;

public interface MeetingMediaService {
    /**
     * Action: meeting의 session Id 기반으로 session 생성
     * Input:
     * - Long meetingId: meeting ID
     * Success:
     * - ok()
     * Persistence:
     * - (추가) openvidu에 세션 등록
     * Failures:
     * - <404>: 존재하지 않는 meetingId
     */
    Result createSession(Long meetingId);

    /**
     * Action: meeting의 session에 connection을 등록
     * Input:
     * - Long meetingId: meeting ID
     * - Long userId: user Id
     * Success:
     * - ok(String) 커넥션의 토큰 리턴
     * Persistence:
     * - (추가) openvidu의 세션에 커넥션 등록
     * Failures:
     * - <404>: 존재하지 않는 meetingId
     * - <404>: 존재하지 않는 userId
     */
    Result<String> createConnection(Long meetingId, Long userId);

    /**
     * Action: meeting의 session Id 기반으로 session 삭제
     * Input:
     * - Long meetingId: meeting ID
     * Success:
     * - ok()
     * Persistence:
     * - (삭제) openvidu에 세션 삭제
     * Failures:
     * - <404>: 존재하지 않는 meetingId
     */
    Result closeSession(Long meetingId);

    /**
     * Action: meeting의 session에 connection을 삭제
     * Input:
     * - Long meetingId: meeting ID
     * - Long userId: user Id
     * Success:
     * - ok(String) 커넥션의 토큰 리턴
     * Persistence:
     * - (추가) openvidu의 세션에 커넥션 삭제
     * Failures:
     * - <404>: 존재하지 않는 meetingId
     * - <404>: 존재하지 않는 userId
     */
    Result closeConnection(Long meetingId, Long userId);

    /**
     * Action: meeting의 session에 연결된 유저들을 출력
     * Input:
     * - Long meetingId: meeting ID
    * Success:
    * - ok(List<UserEntity>)
     * Persistence:
     * - (조회)
     * Failures:
     * - <404>: 존재하지 않는 meetingId
     */
    Result<List<UserEntity>> getConnectedUsers(Long meetingId);
}
