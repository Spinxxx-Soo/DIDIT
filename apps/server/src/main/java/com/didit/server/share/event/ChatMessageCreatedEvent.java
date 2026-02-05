package com.didit.server.share.event;

public record ChatMessageCreatedEvent(
        long channelId,
        long userId,
        String content,
        long sentAtEpochMs
) {}