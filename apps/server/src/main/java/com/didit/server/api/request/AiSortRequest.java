package com.didit.server.api.request;

import java.util.List;

public record AiSortRequest(
        long userId,
        long projectId,
        List<AiIssueInfo> issues
) {
    public record AiIssueInfo(
            long issueId,
            String title,
            String body,
            String priority
    ) {}
}