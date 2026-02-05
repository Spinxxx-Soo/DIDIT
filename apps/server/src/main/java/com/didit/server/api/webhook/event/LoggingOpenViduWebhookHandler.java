package com.didit.server.api.webhook.event;

import com.didit.server.api.scheduling.RecordingStopSchedulerService;
import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.MeetingRecordEntity;
import com.didit.server.service.command.UpdateRecordingCommand;
import com.didit.server.service.service.MeetingMediaRecordingService;
import com.didit.server.service.service.MeetingUserService;
import com.didit.server.share.TimeUtils;
import com.didit.server.share.event.*;
import com.didit.server.service.service.MeetingService;
import com.didit.server.service.service.UserService;
import com.didit.server.share.result.ResultError;
import com.didit.server.share.result.impl.NotFoundError;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class LoggingOpenViduWebhookHandler implements OpenViduWebhookHandler {
    private final ApplicationEventPublisher publisher;
    private final UserService userService;
    private final MeetingService meetingService;
    private final MeetingUserService meetingUserService;
    private final MeetingMediaRecordingService meetingMediaRecordingService;
    private final RecordingStopSchedulerService recordingStopSchedulerService;

    private void pubErrorEvent(long channelId, ResultError error)
    {
        publisher.publishEvent(new MediaErrorEvent(channelId, error.getResponse()));
    }



    @Override
    public void onSessionCreated(SessionCreatedEvent e) {
        log.info("[OV] sessionCreated sessionId={}", e.sessionId());

    }

    @Override
    public void onSessionDestroyed(SessionDestroyedEvent e) {
        log.info("[OV] sessionDestroyed sessionId={} reason={} duration={}",
                e.sessionId(), e.reason(), e.duration());

    }

    @Override
    public void onParticipantJoined(ParticipantJoinedEvent e) {
        log.info("[OV] participantJoined sessionId={} connId={} clientData={}",
                e.sessionId(), e.connectionId(), e.clientData());
        var findMeetingResult = meetingService.findBySessionId(e.sessionId());
        if(findMeetingResult.isFailure()) {
            log.error("[OV] onParticipantJoined - Meeting Entity를 찾을수 없습니다 : {}", e.sessionId());
            return;
        }
        var meetingEntity = findMeetingResult.getOrThrow();

        var findMeetingUserResult = meetingUserService.findMeetingUserByToken(e.connectionId());
        if (findMeetingUserResult.isFailure()){
            log.error("[OV] onParticipantJoined - Meeting User Entity를 찾을수 없습니다 : {}", e.connectionId());
            pubErrorEvent(meetingEntity.getId(), new NotFoundError("connectionId", e.connectionId()));
            return;
        }
        var userId = findMeetingUserResult.getOrThrow().getUser().getId();

        var findUserResult = userService.findUserById(userId);
        if (findUserResult.isFailure()){
            log.error("[OV] onParticipantJoined - User Entity를 찾을수 없습니다 : {}", userId);
            pubErrorEvent(meetingEntity.getId(), new NotFoundError("userId", userId));
            return;
        }
        var userEntity = findUserResult.getOrThrow();

        var event = new MediaParticipantJoinedEvent(
                meetingEntity.getId(),
                e.timestamp(),
                e.sessionId(),
                e.connectionId(),
                userEntity
                );
        publisher.publishEvent(event);
    }

    @Override
    public void onParticipantLeft(ParticipantLeftEvent e) {
        log.info("[OV] participantLeft sessionId={} connId={} reason={} duration={}",
                e.sessionId(), e.connectionId(), e.reason(), e.duration());
        var findMeetingResult = meetingService.findBySessionId(e.sessionId());
        if(findMeetingResult.isSuccess()) {
            log.error("[OV] onParticipantLeft - Meeting Entity를 찾을수 없습니다 : {}", e.sessionId());
            return;
        }
        var meetingEntity = findMeetingResult.getOrThrow();

        var findMeetingUserResult = meetingUserService.findMeetingUserByToken(e.connectionId());
        if (findMeetingUserResult.isFailure()){
            log.error("[OV] onParticipantLeft - Meeting User Entity를 찾을수 없습니다 : {}", e.connectionId());
            pubErrorEvent(meetingEntity.getId(), new NotFoundError("connectionId", e.connectionId()));
            return;
        }
        var userId = findMeetingUserResult.getOrThrow().getUser().getId();

        var findUserResult = userService.findUserById(userId);
        if (findUserResult.isFailure()){
            log.error("[OV] onParticipantLeft - User Entity를 찾을수 없습니다 : {}", userId);
            pubErrorEvent(meetingEntity.getId(), new NotFoundError("userId", userId));
            return;
        }
        var userEntity = findUserResult.getOrThrow();

        var event = new MediaParticipantLeftEvent(
                meetingEntity.getId(),
                e.timestamp(),
                e.sessionId(),
                e.connectionId(),
                userEntity
        );
        publisher.publishEvent(event);
    }

    @Override
    public void onWebrtcConnectionCreated(WebrtcConnectionCreatedEvent e) {
        log.info("[OV] webrtcConnectionCreated sessionId={} connId={} streamId={} dir={} from={}",
                e.sessionId(), e.connectionId(), e.streamId(), e.connection(), e.receivingFrom());
        var findMeetingResult = meetingService.findBySessionId(e.sessionId());
        if(findMeetingResult.isSuccess()) {
            log.error("[OV] onWebrtcConnectionCreated - Meeting Entity를 찾을수 없습니다 : {}", e.sessionId());
            return;
        }
        var meetingEntity = findMeetingResult.getOrThrow();

        var findMeetingUserResult = meetingUserService.findMeetingUserByToken(e.connectionId());
        if (findMeetingUserResult.isFailure()){
            log.error("[OV] onWebrtcConnectionCreated - Meeting User Entity를 찾을수 없습니다 : {}", e.connectionId());
            pubErrorEvent(meetingEntity.getId(), new NotFoundError("connectionId", e.connectionId()));
            return;
        }

        var entity = findMeetingUserResult.getOrThrow();

        var result = meetingUserService.JoinMeeting(entity.getToken());
        if(result.isFailure()){
            pubErrorEvent(meetingEntity.getId(), result.getSingleErrorOrThrow());
        }
    }

    @Override
    public void onWebrtcConnectionDestroyed(WebrtcConnectionDestroyedEvent e) {
        log.info("[OV] webrtcConnectionDestroyed sessionId={} connId={} streamId={} reason={} duration={}",
                e.sessionId(), e.connectionId(), e.streamId(), e.reason(), e.duration());
        var findMeetingResult = meetingService.findBySessionId(e.sessionId());
        if(findMeetingResult.isSuccess()) {
            log.error("[OV] onWebrtcConnectionDestroyed - Meeting Entity를 찾을수 없습니다 : {}", e.sessionId());
            return;
        }
        var meetingEntity = findMeetingResult.getOrThrow();

        var findMeetingUserResult = meetingUserService.findMeetingUserByToken(e.connectionId());
        if (findMeetingUserResult.isFailure()){
            log.error("[OV] onWebrtcConnectionDestroyed - Meeting User Entity를 찾을수 없습니다 : {}", e.connectionId());
            pubErrorEvent(meetingEntity.getId(), new NotFoundError("connectionId", e.connectionId()));
            return;
        }

        var entity = findMeetingUserResult.getOrThrow();

        var result = meetingUserService.leftMeeting(entity.getToken());
        if(result.isFailure()){
            pubErrorEvent(meetingEntity.getId(), result.getSingleErrorOrThrow());
            return;
        }
    }

    @Override
    public void onRecordingStatusChanged(RecordingStatusChangedEvent e) {
        log.info("[OV] recordingStatusChanged sessionId={} recordingId={} status={} reason={} size={} duration={}",
                e.sessionId(), e.id(), e.status(), e.reason(), e.size(), e.duration());
        // TODO: 녹화 상태 반영 (started/stopped/ready/failed)
        var findMeetingResult = meetingService.findBySessionId(e.sessionId());
        if(findMeetingResult.isFailure()) {
            log.error("[OV] onRecordingStatusChanged - Meeting Entity를 찾을수 없습니다 : {}", e.sessionId());
            return;
        }
        var meetingEntity = findMeetingResult.getOrThrow();

        var findRecordingResult = meetingMediaRecordingService.findMeetingRecordBySessionId(e.id());
        if(findRecordingResult.isFailure()) {
            log.error("[OV] onRecordingStatusChanged - Recording Entity를 찾을수 없습니다 : {}", e.id());
            pubErrorEvent(meetingEntity.getId(), findRecordingResult.getSingleErrorOrThrow());
            return;
        }
        var recordEntity =  findRecordingResult.getOrThrow();

        switch (e.status()) {
            case "started" -> {
                recordingStopSchedulerService.scheduleStopAfter1Hour(recordEntity.getId());
                onRecordingStarted(e, meetingEntity, recordEntity);
                return;
            }
            case "failed" -> {
                onRecordingStopped(e, meetingEntity, recordEntity);
                return;
            }
            case "stopped" -> {
                onRecordingStopped(e, meetingEntity, recordEntity);
                //todo redis pubsub
                return;
            }
        }

    }

    private void onRecordingStarted(RecordingStatusChangedEvent e, MeetingEntity meetingEntity, MeetingRecordEntity recordEntity) {
        var cmd = new UpdateRecordingCommand(TimeUtils.toLocalDateTime(e.timestamp()), null);
        var updateResult = meetingMediaRecordingService.UpdateRecording(recordEntity.getId(), cmd);
        if(updateResult.isFailure()){
            log.error("[OV] onRecordingStarted - 실패 : {}, {}", e.sessionId(), cmd);
            pubErrorEvent(meetingEntity.getId(), updateResult.getSingleErrorOrThrow());
            return;
        }

        var event = new MediaRecordingStartEvent(meetingEntity.getId(), e.timestamp(), e.sessionId());
        publisher.publishEvent(event);
    }

    private void onRecordingStopped(RecordingStatusChangedEvent e, MeetingEntity meetingEntity, MeetingRecordEntity recordEntity) {
        var cmd = new UpdateRecordingCommand(null, TimeUtils.toLocalDateTime(e.timestamp()));
        var updateResult = meetingMediaRecordingService.UpdateRecording(recordEntity.getId(), cmd);
        if(updateResult.isFailure()){
            log.error("[OV] onRecordingStopped - 실패 : {}, {}", e.sessionId(), cmd);
            pubErrorEvent(meetingEntity.getId(), updateResult.getSingleErrorOrThrow());
            return;
        }

        var event = new MediaRecordingStopEvent(meetingEntity.getId(), e.timestamp(), e.sessionId());
        publisher.publishEvent(event);
    }

    @Override
    public void onFilterEventDispatched(FilterEventDispatchedEvent e) {
        log.info("[OV] filterEventDispatched sessionId={} streamId={} filterType={} eventType={}",
                e.sessionId(), e.streamId(), e.filterType(), e.eventType());

    }

    @Override
    public void onSignalSent(SignalSentEvent e) {
        log.info("[OV] signalSent sessionId={} from={} to={} type={}",
                e.sessionId(), e.from(), e.to(), e.type());

    }
}
