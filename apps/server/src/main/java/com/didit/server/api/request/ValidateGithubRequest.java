package com.didit.server.api.request;

import jakarta.validation.constraints.NotNull;

public record ValidateGithubRequest (
        @NotNull
        String orgName,
        @NotNull
        String repoName
){ }
