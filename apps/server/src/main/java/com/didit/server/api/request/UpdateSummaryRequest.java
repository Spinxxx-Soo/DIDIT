package com.didit.server.api.request;

public record UpdateSummaryRequest(
        String title,
        String summary
) {
}
