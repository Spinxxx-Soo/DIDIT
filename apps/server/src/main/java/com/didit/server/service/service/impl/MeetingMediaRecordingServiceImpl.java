package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingRecordEntity;
import com.didit.server.data.external.openvidu.OpenViduClient;
import com.didit.server.data.repository.MeetingRecordRepository;
import com.didit.server.data.repository.MeetingRepository;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.service.command.UpdateRecordingCommand;
import com.didit.server.service.service.MeetingMediaRecordingService;
import com.didit.server.share.event.MediaRecordingStartEvent;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.NotFoundError;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.sql.Time;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class MeetingMediaRecordingServiceImpl implements MeetingMediaRecordingService {
    private final MeetingRepository meetingRepository;
    private final MeetingRecordRepository meetingRecordRepository;
    private final OpenViduClient openViduClient;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher publisher;

    @Override
    public Result<Long> StartRecording(Long meetingId, Long userId) {
        var meeting = meetingRepository.findById(meetingId);
        if (meeting.isEmpty()) {
            return Result.fail(new NotFoundError("meetingId", meetingId));
        }
        var meetingEntity = meeting.get();

        var recordingName = UUID.randomUUID().toString();
        var startResult = openViduClient.startRecording(meetingEntity.getSessionId(), recordingName);
        if(startResult.isFailure()){
            return Result.fail(startResult.getErrors());
        }
        var recordingRef = startResult.getOrThrow();
        var user = userRepository.findById(userId);
        if (user.isEmpty()) {
            return Result.fail(new NotFoundError("userId", userId));
        }

        var userEntity = user.get();

        var recordEntity = MeetingRecordEntity.builder()
                .meeting(meetingEntity)
                .createdBy(userEntity)
                .recordingSessionId(recordingRef.getRecordingId())
                .recordingName(recordingName)
                .startAt(LocalDateTime.now())
                .build();

        var result = meetingRecordRepository.saveAndFlush(recordEntity);

        var event = new MediaRecordingStartEvent(
                meetingEntity.getId(),
                Instant.now().getEpochSecond(),
                meetingEntity.getSessionId(),
                recordEntity.getId());

        publisher.publishEvent(event);
        return Result.ok(result.getId());
    }

    @Override
    public Result StopRecording(Long meetingRecordId) {
        var meetingRecord = meetingRecordRepository.findById(meetingRecordId);
        if (meetingRecord.isEmpty()){
            return Result.fail(new NotFoundError("meetingRecordId", meetingRecordId));
        }

        var sessionId = meetingRecord.get().getRecordingSessionId();

        var result = openViduClient.stopRecording(sessionId);
        if (result.isFailure()){
            return Result.fail(result.getErrors());
        }

        return Result.ok();
    }

    @Override
    public Result UpdateRecording(Long meetingRecordId, UpdateRecordingCommand updateRecordingCommand) {
        var meetingRecordFindResult = meetingRecordRepository.findById(meetingRecordId);
        if (meetingRecordFindResult.isEmpty()){
            return Result.fail(new NotFoundError("meetingRecordId", meetingRecordId));
        }
        var entity =  meetingRecordFindResult.get();
        if(updateRecordingCommand.endAt() != null && !updateRecordingCommand.endAt().equals(entity.getEndAt())){
            entity.setEndAt(updateRecordingCommand.endAt());
        }

        if (updateRecordingCommand.startedAt() != null && !updateRecordingCommand.startedAt().equals(entity.getStartAt())){
            entity.setStartAt(updateRecordingCommand.startedAt());
        }

        meetingRecordRepository.saveAndFlush(entity);
        return Result.ok();
    }

    @Override
    public Result<MeetingRecordEntity> findMeetingRecordBySessionId(String sessionId) {
        var meetingRecordFindResult = meetingRecordRepository.findByRecordingSessionId(sessionId);
        return meetingRecordFindResult.map(Result::ok).orElseGet(() -> Result.fail(new NotFoundError("sessionId", sessionId)));
    }

    @Override
    public Result<String> findDownloadURL(Long meetingRecordId){
        var meetingRecordFindResult = meetingRecordRepository.findById(meetingRecordId);
        if (meetingRecordFindResult.isEmpty()){
            return Result.fail(new NotFoundError("meetingRecordId", meetingRecordId));
        }
        var entity =  meetingRecordFindResult.get();

        var refFindResult = openViduClient.findRecording(entity.getRecordingSessionId());
        if (refFindResult.isFailure()){
            return Result.fail(refFindResult.getErrors());
        }

        return Result.ok(refFindResult.getOrThrow().getDownloadUrl());
    }
}
