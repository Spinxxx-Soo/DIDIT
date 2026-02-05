package com.didit.server.share.event;

import com.didit.server.api.response.UserResponse;
import com.didit.server.data.entity.UserEntity;

import java.time.LocalDateTime;

public record MediaParticipantLeftEvent(
        long channelId,
        long timestamp,
        String sessionId,
        String connectionId,
        UserEntity user
) {
}
