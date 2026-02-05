package com.didit.server.share.event;

import java.time.LocalDateTime;

public record ChatMessageUpdatedEvent (
        Long channelId,
        Long chatId,
        String content,
        LocalDateTime editedAt
) { }
