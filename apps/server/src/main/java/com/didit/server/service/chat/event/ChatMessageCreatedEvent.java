package com.didit.server.service.chat.event;

public record ChatMessageCreatedEvent(
        String eventId,
        long channelId,
        long userId,
        String content,
        long sentAtEpochMs
) {}