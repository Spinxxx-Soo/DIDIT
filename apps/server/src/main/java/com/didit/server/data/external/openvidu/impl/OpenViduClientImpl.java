package com.didit.server.data.external.openvidu.impl;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.external.openvidu.OpenViduClient;
import com.didit.server.data.external.openvidu.dto.OpenViduConnectionRef;
import com.didit.server.data.external.openvidu.dto.OpenViduSessionRef;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.ServerError;
import io.openvidu.java.client.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@RequiredArgsConstructor
@Component
@Slf4j
public class OpenViduClientImpl implements OpenViduClient {
    private final OpenVidu openVidu;

    @Override
    public Result<OpenViduSessionRef> createSession(MeetingEntity meetingEntity) {
        var builder = new SessionProperties.Builder();
        builder.customSessionId(meetingEntity.getSessionId());
        builder.forcedVideoCodec(VideoCodec.H264);
        builder.allowTranscoding(false);
        builder.recordingMode(RecordingMode.MANUAL);
        var properties = builder.build();
        Session result;
        try {
            result = openVidu.createSession(properties);
        }catch (Exception ex) {
            log.error("오픈비두 세션 생성중 예외 발생.", ex);
            return Result.fail(new ServerError("exception", ex));
        }
        return Result.ok(new OpenViduSessionRef(result));
    }

    @Override
    public Result closeSession(String sessionId) {
        var session = openVidu.getActiveSession(sessionId);
        if(session == null){
            log.error("오픈비두 세션 삭제중 세션을 찾을수가 없음.");
            return Result.fail(new ServerError("세션을 찾을수가 없음", sessionId));
        }
        try {
            session.close();
        }catch (Exception ex) {
            log.error("오픈비두 세션 삭제중 예외 발생.", ex);
            return Result.fail(new ServerError("exception", ex));
        }
        return Result.ok();
    }

    @Override
    public boolean existSession(String sessionId) {
        return openVidu.getActiveSession(sessionId) != null;
    }

    @Override
    public Result<OpenViduConnectionRef> createConnection(UserEntity userEntity, String sessionId) {
        var session = openVidu.getActiveSession(sessionId);
        if(session == null){
            log.error("오픈비두 커넥션 생성중 세션을 찾을수가 없음.");
            return Result.fail(new ServerError("세션을 찾을수가 없음", sessionId));
        }

        var builder = new ConnectionProperties.Builder();
        builder.type(ConnectionType.WEBRTC);
        builder.role(OpenViduRole.PUBLISHER);
        builder.data(userEntity.getId().toString());
        builder.record(true);
        var properties = builder.build();
        Connection result;
        try {
            result = session.createConnection(properties);
        }catch (Exception ex) {
            log.error("오픈비두 커넥션 생성중 예외 발생.", ex);
            return Result.fail(new ServerError("exception", ex));
        }

        return Result.ok(new OpenViduConnectionRef(result));
    }

    @Override
    public Result closeConnection(String sessionId, String connectionId) {
        var session = openVidu.getActiveSession(sessionId);
        if(session == null){
            log.error("오픈비두 커넥션 삭제중 세션을 찾을수가 없음.");
            return Result.fail(new ServerError("세션을 찾을수가 없음", sessionId));
        }
        var connection = session.getConnection(connectionId);
        if(connection == null){
            log.error("오픈비두 커넥션 삭제중 커넥션을 찾을수가 없음.");
            return Result.fail(new ServerError("커넥션을 찾을수가 없음", connectionId));
        }

        try {
            session.forceDisconnect(connection);
        }catch (Exception ex) {
            log.error("오픈비두 커넥션 삭제중 예외 발생.", ex);
            return Result.fail(new ServerError("exception", ex));
        }

        return Result.ok();
    }

    @Override
    public boolean existConnection(String sessionId, String connectionId) {
        var session = openVidu.getActiveSession(sessionId);
        return session != null
                && session.getConnection(connectionId) != null;
    }

    @Override
    public Result<List<OpenViduConnectionRef>> findConnections(String sessionId) {
        var session = openVidu.getActiveSession(sessionId);
        if(session == null){
            log.error("오픈비두 커넥션 삭제중 세션을 찾을수가 없음.");
            return Result.fail(new ServerError("세션을 찾을수가 없음", sessionId));
        }
        var result = session.getConnections();
        return Result.ok(
            result.stream().map(OpenViduConnectionRef::new).toList()
        );
    }

    @Override
    public Result fetch() {
        try{
            openVidu.fetch();
            return Result.ok();
        } catch (Exception ex) {
            log.error("오픈비두 fetch중 예외 발생.");
            return Result.fail(new ServerError("exception", ex));
        }
    }

    @Override
    public Result startRecording(String sessionId, String recordName) {
        var session = openVidu.getActiveSession(sessionId);
        if(session == null){
            log.error("오픈비두 세션 녹화중 세션을 찾을수가 없음.");
            return Result.fail(new ServerError("세션을 찾을수가 없음", sessionId));
        }

        var propertiesBuilder = new RecordingProperties.Builder();
        propertiesBuilder.hasAudio(true);
        propertiesBuilder.hasVideo(false);
        propertiesBuilder.name(recordName);
        propertiesBuilder.outputMode(Recording.OutputMode.COMPOSED_QUICK_START);
        var properties = propertiesBuilder.build();
        try {
            openVidu.startRecording(sessionId, properties);
        }catch (Exception ex) {
            log.error("오픈비두 세션 녹화중 예외 발생.", ex);
            return Result.fail(new ServerError("exception", ex));
        }

        return Result.ok();
    }

    @Override
    public Result stopRecording(String recordingId) {
        try {
            var session = openVidu.getRecording(recordingId);
        } catch (Exception e) {
            log.error("오픈비두 녹화중 녹화 세션을 찾을수가 없음.", e);
            return Result.fail(new ServerError("세션을 찾을수가 없음", recordingId));
        }

        try {
            openVidu.stopRecording(recordingId);
        }catch (Exception ex) {
            log.error("오픈비두 세션 녹화중 예외 발생.", ex);
            return Result.fail(new ServerError("exception", ex));
        }

        return Result.ok();

    }
}
