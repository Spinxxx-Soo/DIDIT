package com.didit.server.data.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "issue_assignees",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_issue_assignees_issue_user", columnNames = {"issue_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_issue_assignees_issue_id", columnList = "issue_id"),
                @Index(name = "idx_issue_assignees_user_id", columnList = "user_id")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class IssueAssigneeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK: issue_assignees.issue_id -> issues.id (ON DELETE CASCADE)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issue_id", nullable = false)
    private IssueEntity issue;

    // FK: issue_assignees.user_id -> users.id (ON DELETE RESTRICT)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
