package com.didit.server.api.request;

import com.didit.server.data.entity.enums.IssuePriority;
import com.didit.server.data.entity.enums.IssueStatus;

import java.util.List;

public record CreateIssueRequest (
        String orgName,
        String repoName,
        Long issueId,
        IssueStatus issueStatus,
        IssuePriority issuePriority,
        String title,
        String body,
        List<Long> assigneeIds
){ }
