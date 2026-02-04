package com.didit.server.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProjectNameRequest(
        @NotBlank(message = "프로젝트 이름은 비어있을 수 없습니다.")
        @Size(max = 100)
        String name
) {}
