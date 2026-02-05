package com.didit.server.share.event;

import java.time.LocalDateTime;

public record MediaRecordingStopEvent(
        long channelId,
        long timestamp,
        String sessionId
) {
}
