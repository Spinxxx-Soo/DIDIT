package com.didit.server.api.response;

import com.didit.server.data.entity.ProjectEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectResponse {
    private Long id;
    private String name;
    private Long ownerId;
    private Long repoId;
    private String repoFullName;
    private String thumbnailUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProjectResponse fromEntity(ProjectEntity entity){
        return builder()
                .id(entity.getId())
                .name(entity.getName())
                .ownerId(entity.getOwner().getId())
                .repoId(entity.getRepoId())
                .repoFullName(entity.getRepoFullName())
                .thumbnailUrl(entity.getThumbnailUrl())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
