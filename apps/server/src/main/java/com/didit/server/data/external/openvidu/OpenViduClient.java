package com.didit.server.data.external.openvidu;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.ProjectUserEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.external.openvidu.dto.OpenViduConnectionRef;
import com.didit.server.data.external.openvidu.dto.OpenViduRecordingRef;
import com.didit.server.data.external.openvidu.dto.OpenViduSessionRef;
import com.didit.server.share.result.Result;

import java.util.List;

public interface OpenViduClient {
    /**
     * Action: 세션 생성
     * Input:
     *  - MeetingEntity meetingEntity
     * Success:
     *  - ok(OpenViduSessionRef)
     * Persistence:
     *  - (생성)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - 500: 오픈비두 세션 생성중 예외 발생. (metadata: "exception", ex)
     */
    Result<OpenViduSessionRef> createSession(MeetingEntity meetingEntity);
    /**
     * Action: 세션 삭제
     * Input:
     *  - String sessionId
     * Success:
     *  - ok()
     * Persistence:
     *  - (삭제)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - 500: <오픈비두 세션 삭제중 세션을 찾을수가 없음.> ServerError("세션을 찾을수가 없음", sessionId))
     *  - 500: <오픈비두 세션 삭제중 예외 발생.> ServerError("exception", ex)
     */
    Result closeSession(String sessionId);

    boolean existSession(String sessionId);
    /**
     * Action: 세션의 커넥션의 생성
     * Input:
     *  - UserEntity userEntity
     *  - String sessionId
     * Success:
     *  - ok(OpenViduConnectionRef)
     * Persistence:
     *  - (생성)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - 500: <오픈비두 커넥션 생성중 세션을 찾을수가 없음.> ServerError("세션을 찾을수가 없음", sessionId)
     *  - 500: <오픈비두 커넥션 생성중 예외 발생.> ServerError("exception", ex)
     */
    Result<OpenViduConnectionRef> createConnection(UserEntity userEntity, String sessionId);
    /**
     * Action: 세션의 커넥션 삭제
     * Input:
     *  - String sessionId
     *  - String connectionId
     * Success:
     *  - ok()
     * Persistence:
     *  - (삭제)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - 500: <오픈비두 커넥션 삭제중 세션을 찾을수가 없음.>ServerError("세션을 찾을수가 없음", sessionId)
     *  - 500: <오픈비두 커넥션 삭제중 커넥션을 찾을수가 없음.>ServerError("커넥션을 찾을수가 없음", connectionId)
     *  - 500: <오픈비두 커넥션 삭제중 예외 발생.>new ServerError("exception", ex)
     */
    Result closeConnection(String sessionId, String connectionId);

    boolean existConnection(String sessionId, String connectionId);

    /**
     * Action: 세션의 커넥션 조회
     * Input:
     *  - String sessionId
     * Success:
     *  - ok(List<OpenViduConnectionRef>)
     * Persistence:
     *  - (조회)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - 500: <오픈비두 커넥션 조회중 세션을 찾을수가 없음.>ServerError("세션을 찾을수가 없음", sessionId)
     */
    Result<List<OpenViduConnectionRef>> findConnections(String sessionId);

    /**
     * Action: openvidu fetch
     * Input:
     * Success:
     *  - ok()
     * Persistence:
     *  - (조회)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - 500: <오픈비두 fetch중 예외 발생.>ServerError("exception", ex)
     */
    Result fetch();

    /**
     * Action: 세션의 녹화 시작
     * Input:
     *  - String sessionId
     *  - String recordName
     * Success:
     *  - ok(OpenViduRecordingRef)
     * Persistence:
     *  - (수정)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - 500: <오픈비두 커넥션 조회중 세션을 찾을수가 없음.>ServerError("세션을 찾을수가 없음", sessionId)
     */
    Result<OpenViduRecordingRef> startRecording(String sessionId, String recordName);

    /**
     * Action: 세션의 녹화 중단
     * Input:
     *  - String sessionId
     *
     * Success:
     *  - ok(OpenViduRecordingRef)
     * Persistence:
     *  - (수정)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - 500: <오픈비두 커넥션 조회중 세션을 찾을수가 없음.>ServerError("세션을 찾을수가 없음", sessionId)
     */
    Result<OpenViduRecordingRef> stopRecording(String recordingId);

    Result<OpenViduRecordingRef> findRecording(String recordingId);
}
