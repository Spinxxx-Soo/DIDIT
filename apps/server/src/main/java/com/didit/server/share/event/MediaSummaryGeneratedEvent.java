package com.didit.server.share.event;

public record MediaSummaryGeneratedEvent(
        Long projectId,
        Long summaryId
) {
}
