package com.didit.server.data.entity;

import com.didit.server.data.entity.enums.IssuePriority;
import com.didit.server.data.entity.enums.IssueStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "issues",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_issues_project_github_issue_id",
                        columnNames = {"project_id", "github_issue_id"}
                )
        },
        indexes = {
                @Index(name = "idx_issues_project_id", columnList = "project_id"),
                @Index(name = "idx_issues_github_issue_id", columnList = "github_issue_id"),
                @Index(name = "idx_issues_issue_no", columnList = "issue_no"),
                @Index(name = "idx_issues_author_id", columnList = "author_id")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class IssueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK: issues.project_id -> projects.id (ON DELETE CASCADE)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private ProjectEntity project;

    @Column(name = "github_issue_id", nullable = false)
    private Long githubIssueId;

    @Column(name = "issue_no", nullable = false)
    private Integer issueNo;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Lob
    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 10)
    private IssueStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    private IssuePriority priority;

    // FK: issues.author_id -> users.id (ON DELETE RESTRICT)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Builder.Default
    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private Set<IssueAssigneeEntity> assignees = new HashSet<>();
}
