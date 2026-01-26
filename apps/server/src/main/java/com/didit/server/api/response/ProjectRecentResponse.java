package com.didit.server.api.response;

import com.didit.server.data.entity.ProjectRecentEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectRecentResponse {

    private Long id;
    private UserResponse user;
    private ProjectResponse project;
    private LocalDateTime lastViewedAt;

    public static ProjectRecentResponse fromEntity(ProjectRecentEntity entity){
        return ProjectRecentResponse.builder()
                .id(entity.getId())
                .user(UserResponse.fromEntity(entity.getUser()))
                .project(ProjectResponse.fromEntity(entity.getProject()))
                .lastViewedAt(entity.getLastViewedAt())
                .build();
    }
}
