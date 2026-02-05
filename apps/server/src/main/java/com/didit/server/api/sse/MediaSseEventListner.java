package com.didit.server.api.sse;

import com.didit.server.api.response.UserResponse;
import com.didit.server.api.sse.payload.*;
import com.didit.server.share.TimeUtils;
import com.didit.server.share.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MediaSseEventListner {
    private final SseHub sseHub;

    @EventListener
    public void onMediaParticipantJoinedEvent(MediaParticipantJoinedEvent e) {
        var payload = MediaParticipantJoinedPayload.builder()
                .channelId(e.channelId())
                .timestamp(TimeUtils.toLocalDateTime(e.timestamp()))
                .sessionId(e.sessionId())
                .connectionId(e.connectionId())
                .user(UserResponse.fromEntity(e.user()))
                .build();
        sseHub.broadcast(payload);
    }
    @EventListener
    public void onMediaParticipantLeftEvent(MediaParticipantLeftEvent e) {
        var payload = MediaParticipantLeftPayload.builder()
                .channelId(e.channelId())
                .timestamp(TimeUtils.toLocalDateTime(e.timestamp()))
                .sessionId(e.sessionId())
                .connectionId(e.connectionId())
                .user(UserResponse.fromEntity(e.user()))
                .build();
        sseHub.broadcast(payload);
    }
    @EventListener
    public void onMediaRecordingStartEvent(MediaRecordingStartEvent e) {
        var payload = MediaRecordingStartPayload.builder()
                .channelId(e.channelId())
                .timestamp(TimeUtils.toLocalDateTime(e.timestamp()))
                .sessionId(e.sessionId())
                .build();
        sseHub.broadcast(payload);
    }

    @EventListener
    public void onMediaRecordingStopEvent(MediaRecordingStopEvent e) {
        var payload = MediaRecordingStopPayload.builder()
                .channelId(e.channelId())
                .timestamp(TimeUtils.toLocalDateTime(e.timestamp()))
                .sessionId(e.sessionId())
                .build();
        sseHub.broadcast(payload);
    }

    @EventListener
    public void onMediaErrorEvent(MediaErrorEvent e) {
        var payload = MediaErrorPayload.builder()
                .channelId(e.channelId())
                .errorResponse(e.errorResponse())
                .build();
        sseHub.broadcast(payload);
    }

    @EventListener
    public void onMediaSummaryGeneratedEvent(MediaSummaryGeneratedEvent e) {
        var payload = MediaSummaryGeneratedPayload.builder()
                .projectId(e.projectId())
                .summaryId(e.summaryId())
                .build();
        sseHub.broadcastInProject(payload);
    }
}
