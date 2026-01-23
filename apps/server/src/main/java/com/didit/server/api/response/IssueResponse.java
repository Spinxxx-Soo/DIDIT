package com.didit.server.api.response;

import com.didit.server.data.entity.IssueAssigneeEntity;
import com.didit.server.data.entity.IssueEntity;
import com.didit.server.data.entity.ProjectEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.entity.enums.IssuePriority;
import com.didit.server.data.entity.enums.IssueStatus;
import com.didit.server.data.entity.enums.MeetingMode;
import com.didit.server.data.entity.enums.MeetingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class IssueResponse {
    private Long id;
    private ProjectResponse project;
    private Long githubIssueId;
    private Integer issueNo;
    private String title;
    private String body;
    private IssueStatus status;
    private IssuePriority priority;
    private UserResponse author;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime closedAt;
    private List<UserResponse> assignees;

    public static IssueResponse fromEntity(IssueEntity entity) {
        return IssueResponse.builder()
                .id(entity.getId())
                .project(ProjectResponse.fromEntity(entity.getProject()))
                .githubIssueId(entity.getGithubIssueId())
                .issueNo(entity.getIssueNo())
                .title(entity.getTitle())
                .body(entity.getBody())
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .author(UserResponse.fromEntity(entity.getAuthor()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .closedAt(entity.getClosedAt())
                .assignees(entity.getAssignees().stream()
                        .map(assignee -> UserResponse.fromEntity(assignee.getUser()))
                        .toList())
                .build();
    }
}

