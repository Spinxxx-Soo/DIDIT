package com.didit.server.api.request;

import com.didit.server.data.entity.enums.IssueStatus;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AnalyzeIssueRequest (
        @NotNull
        String title,
        String body,
        IssueStatus status,
        List<Long> assigneeIds
){ }
