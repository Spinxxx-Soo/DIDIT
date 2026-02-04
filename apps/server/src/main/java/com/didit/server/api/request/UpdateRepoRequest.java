package com.didit.server.api.request;

import jakarta.validation.constraints.NotNull;

public record UpdateRepoRequest(long repoId, @NotNull String repoFullName) { }