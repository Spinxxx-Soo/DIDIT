package com.didit.server.service.chat.event;

import java.time.LocalDateTime;

public record ChatMessageUpdatedEvent (
        Long chatId,
        Long projectId,
        String content,
        LocalDateTime editedAt
) { }
