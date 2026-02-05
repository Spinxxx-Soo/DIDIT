package com.didit.server.share.event;

public record ChatMessageDeletedEvent(
        long channelId,
        Long chatId,
        String content
) { }
