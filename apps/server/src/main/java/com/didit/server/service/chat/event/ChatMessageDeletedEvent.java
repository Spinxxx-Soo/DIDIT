package com.didit.server.service.chat.event;

public record ChatMessageDeletedEvent(
        long projectId,
        Long chatId,
        String content
) { }
