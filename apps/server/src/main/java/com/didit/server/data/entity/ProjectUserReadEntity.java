package com.didit.server.data.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_user_reads",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_project_user_reads_project_user", columnNames = {"project_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_project_user_reads_project_id", columnList = "project_id"),
                @Index(name = "idx_project_user_reads_user_id", columnList = "user_id"),
                @Index(name = "idx_project_user_reads_last_read_chat_id", columnList = "last_read_chat_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectUserReadEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "last_read_chat_id")
    private Long lastReadChatId; // 마지막으로 읽은 채팅 ID

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
