package com.didit.server.api.request;

import java.util.List;

public record AiSortRequest(
        long userId,
        long projectId,
        List<AiIssueInfo> issues
) {
    public record AiIssueInfo(
            long issue_id,
            String title,
            String body
    ) {}
}