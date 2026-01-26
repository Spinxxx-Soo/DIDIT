package com.didit.server.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "project_recents",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_project_recents_user_project", columnNames = {"user_id", "project_id"})
        },
        indexes = {
                @Index(name = "idx_project_recents_user_id", columnList = "user_id"),
                @Index(name = "idx_project_recents_last_viewed_at", columnList = "last_viewed_at")
        }
)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ProjectRecentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_project_recents_user_id")
    )
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "project_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_project_recents_project_id")
    )
    private ProjectEntity project;

    @UpdateTimestamp
    @Column(name = "last_viewed_at", nullable = false)
    private LocalDateTime lastViewedAt;
}