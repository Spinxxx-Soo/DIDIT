package com.didit.server.api.request;

import com.didit.server.data.entity.enums.IssuePriority;
import com.didit.server.data.entity.enums.IssueStatus;

import java.util.List;

public record UpdateIssueRequest(
        String title,
        String body,
        IssueStatus issueStatus,
        IssuePriority issuePriority,
        List<Long> assigneeIds
) {}
