package com.didit.server.api.request;

public record AiQueueRequest (
        long userId,
        long issueId,
        String title,
        String body
){ }
