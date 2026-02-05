package com.didit.server.api.request;

import java.util.List;

public record UpdateIssueRequest(
        String title,
        String body,
        List<Long> assigneeIds
) {}
