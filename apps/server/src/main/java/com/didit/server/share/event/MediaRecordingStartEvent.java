package com.didit.server.share.event;

import java.time.LocalDateTime;

public record MediaRecordingStartEvent(
        long channelId,
        long timestamp,
        String sessionId
) {
}
