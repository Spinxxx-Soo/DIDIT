package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingUserEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.external.openvidu.OpenViduClient;
import com.didit.server.data.external.openvidu.dto.OpenViduConnectionRef;
import com.didit.server.data.repository.MeetingRecordRepository;
import com.didit.server.data.repository.MeetingRepository;
import com.didit.server.data.repository.MeetingUserRepository;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.service.result.MediaCreateConnectionResult;
import com.didit.server.service.service.MeetingMediaService;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.ConflictError;
import com.didit.server.share.result.impl.NotFoundError;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MeetingMediaServiceImpl implements MeetingMediaService {
    private final OpenViduClient openViduClient;
    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;
    private final MeetingUserRepository meetingUserRepository;

    @Override
    public Result createSession(Long meetingId) {
        var meeting = meetingRepository.findById(meetingId);
        if (meeting.isEmpty()) {
            return Result.fail(new NotFoundError("meetingId", meetingId));
        }
        var meetingEntity = meeting.get();

        var fetchResult = openViduClient.fetch();
        if(fetchResult.isFailure()){
            return  Result.fail(fetchResult.getErrors());
        }
        if(openViduClient.existSession(meetingEntity.getSessionId())){
            return Result.ok();
        }

        var result = openViduClient.createSession(meetingEntity);
        if (result.isFailure()) {
            return Result.fail(result.getErrors());
        }
        return Result.ok();
    }

    @Override
    public Result<MediaCreateConnectionResult> createConnection(Long meetingId, Long userId) {
        var meeting = meetingRepository.findById(meetingId);
        if (meeting.isEmpty()) {
            return Result.fail(new NotFoundError("meetingId", meetingId));
        }
        var user = userRepository.findById(userId);
        if (user.isEmpty()) {
            return Result.fail(new NotFoundError("userId", userId));
        }
        var meetingEntity = meeting.get();
        var userEntity = user.get();

        var fetchResult = openViduClient.fetch();
        if(fetchResult.isFailure()){
            return Result.fail(fetchResult.getErrors());
        }

        if(!openViduClient.existSession(meetingEntity.getSessionId())){
            var result = openViduClient.createSession(meetingEntity);
            if (result.isFailure()) {
                return Result.fail(result.getErrors());
            }
        }

        var result = openViduClient.createConnection(userEntity, meetingEntity.getSessionId());
        if (result.isFailure()) {
            return Result.fail(result.getErrors());
        }
        var ref = result.getOrThrow();
        var res = new MediaCreateConnectionResult(ref.getConnectionId(), ref.getToken());
        return Result.ok(res);
    }

    @Override
    public Result closeSession(Long meetingId) {
        var meeting = meetingRepository.findById(meetingId);
        if (meeting.isEmpty()) {
            return Result.fail(new NotFoundError("meetingId", meetingId));
        }
        var meetingEntity = meeting.get();

        var fetchResult = openViduClient.fetch();
        if(fetchResult.isFailure()){
            return  Result.fail(fetchResult.getErrors());
        }
        if(!openViduClient.existSession(meetingEntity.getSessionId())){
            return Result.ok();
        }

        var result = openViduClient.closeSession(meetingEntity.getSessionId());
        if (result.isFailure()) {
            return Result.fail(result.getErrors());
        }
        return Result.ok();
    }

    @Override
    public Result closeConnection(Long meetingId, Long userId) {
        var meeting = meetingRepository.findById(meetingId);
        if (meeting.isEmpty()) {
            return Result.fail(new NotFoundError("meetingId", meetingId));
        }
        var user = userRepository.findById(userId);
        if (user.isEmpty()) {
            return Result.fail(new NotFoundError("userId", userId));
        }
        var meetingUser = meetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId);
        if (meetingUser.isEmpty()) {
            return Result.fail(new ConflictError("연결되어있지 않은 커넥션"));
        }
        var meetingEntity = meeting.get();
        var userEntity = user.get();
        var meetingUserEntity = meetingUser.get();
        var fetchResult = openViduClient.fetch();
        if (fetchResult.isFailure()) {
            return Result.fail(fetchResult.getErrors());
        }

        if(!openViduClient.existSession(meetingEntity.getSessionId())){
            return Result.ok();
        }

        var findResult = openViduClient.findConnections(meetingEntity.getSessionId());
        if (findResult.isFailure()) {
            return Result.fail(findResult.getErrors());
        }

        var targetConn = findResult.getOrThrow().stream()
                .filter(x -> x.getConnectionId().equals(meetingUserEntity.getToken())).findFirst();
        if (targetConn.isEmpty()) {
            return Result.fail(new ConflictError("연결되어있지 않은 커넥션"));
        }
        var closeResult = openViduClient.closeConnection(meetingEntity.getSessionId(), targetConn.get().getConnectionId());
        if (closeResult.isFailure()) {
            return Result.fail(closeResult.getErrors());
        }
        return Result.ok();
    }

    @Override
    public Result<List<UserEntity>> getConnectedUsers(Long meetingId) {
        var meeting = meetingRepository.findById(meetingId);
        if (meeting.isEmpty()) {
            return Result.fail(new NotFoundError("meetingId", meetingId));
        }
        var meetingEntity = meeting.get();
        var fetchResult = openViduClient.fetch();
        if (fetchResult.isFailure()) {
            return Result.fail(fetchResult.getErrors());
        }

        if(!openViduClient.existSession(meetingEntity.getSessionId())){
            return Result.ok(List.of());
        }

        var result = openViduClient.findConnections(meetingEntity.getSessionId());
        if (result.isFailure()) {
            return Result.fail(result.getErrors());
        }
        var ids = result.getOrThrow().stream().map(OpenViduConnectionRef::getConnectionId).toList();
        var findResult = meetingUserRepository.findAllByTokenInFetchUser(ids);
        return Result.ok(findResult.stream().map(MeetingUserEntity::getUser).distinct().toList());
    }
}