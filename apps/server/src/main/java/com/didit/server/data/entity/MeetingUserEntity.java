package com.didit.server.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "meeting_users",
        indexes = {
                @Index(name = "idx_meeting_users_meeting_id", columnList = "meeting_id"),
                @Index(name = "idx_meeting_users_user_id", columnList = "user_id"),
                @Index(name = "idx_meeting_users_token", columnList = "token")
        }
)
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MeetingUserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK: meetings(id)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meeting_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_meeting_users_meeting"))
    private MeetingEntity meeting;

    // FK: users(id)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_meeting_users_user"))
    private UserEntity user;

    // OpenVidu token (검색용 인덱스 존재)
    @Column(name = "token", length = 512)
    private String token;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

}
