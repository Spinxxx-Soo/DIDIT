package com.didit.server.api.redis.payload;

public record MediaSummaryGeneratedPayload(
        Long summeryId,
        String status,
        String summary
) {
}
