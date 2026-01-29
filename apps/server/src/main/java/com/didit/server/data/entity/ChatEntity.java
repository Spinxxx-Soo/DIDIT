package com.didit.server.data.entity;

import com.didit.server.data.entity.enums.MessageType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "chats", indexes = {
        @Index(name = "idx_chats_project_created_at", columnList = "project_id, created_at"),
        @Index(name = "idx_chats_meeting_created_at", columnList = "meeting_id, created_at"),
        @Index(name = "idx_chats_user_id", columnList = "user_id")
})
@Getter
@Data
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ChatEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "meeting_id")
    private Long meetingId; // 회의 채팅이 아닐 경우 Null 허용

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    private MessageType messageType; // TEXT, SYSTEM

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt; // Soft Delete용
}
