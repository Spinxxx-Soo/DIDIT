package com.didit.server.api.redis.event;

import com.didit.server.api.redis.RedisHub;
import com.didit.server.api.redis.payload.MediaSummaryDownloadUrlPushPayload;
import com.didit.server.api.response.UserResponse;
import com.didit.server.api.sse.payload.MediaParticipantJoinedPayload;
import com.didit.server.share.TimeUtils;
import com.didit.server.share.event.MediaParticipantJoinedEvent;
import com.didit.server.share.event.MediaSummaryDownloadUrlPushEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class MediaRedisEventListener {
    private final RedisHub redisHub;

    @EventListener
    public void onMediaSummaryDownloadUrlPushEvent(MediaSummaryDownloadUrlPushEvent e) {
        var payload = MediaSummaryDownloadUrlPushPayload.builder()
                .summaryId(e.summaryId())
                .downloadUrl(e.downloadUrl())
                .projectId(e.projectId())
                .meetingId(e.meetingId())
                .build();
        redisHub.push(payload);
    }
}
