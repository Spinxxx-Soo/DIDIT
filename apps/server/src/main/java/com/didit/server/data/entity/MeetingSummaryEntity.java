package com.didit.server.data.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "meeting_summary",
        indexes = {
                @Index(name = "idx_meeting_summary_project_id", columnList = "project_id"),
                @Index(name = "idx_meeting_summary_meeting_id", columnList = "meeting_id"),
                @Index(name = "idx_meeting_summary_edited_by", columnList = "edited_by")
        }
)
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = {"project", "meeting", "editedBy"})
public class MeetingSummaryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    // FK: projects(id) NOT NULL, ON DELETE CASCADE (DB가 처리)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "project_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_meeting_summary_project")
    )
    // 주의: DB는 CASCADE지만, Hibernate에 "삭제 연쇄"를 위임하고 싶지 않다면 굳이 안 달아도 됨.
    //      그래도 DB 동작과 의도를 맞추려면 아래를 붙여도 괜찮음.
    @OnDelete(action = OnDeleteAction.CASCADE)
    private ProjectEntity project;

    // FK: meetings(id) NULL 가능, ON DELETE SET NULL
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(
            name = "meeting_id",
            nullable = true,
            foreignKey = @ForeignKey(name = "fk_meeting_summary_meeting")
    )
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private MeetingEntity meeting;

    @Lob
    @Column(name = "summary_md", nullable = false, columnDefinition = "TEXT")
    private String summaryMd;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    /**
     * DB 컬럼명이 `version`이므로 필드는 다른 이름을 쓰고 매핑만 맞춤.
     * (JPA의 @Version과 의미 혼동 방지)
     */
    @Column(name = "version", nullable = false)
    private Integer summaryVersion;

    // FK: users(id) NULL 가능, ON DELETE SET NULL
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "edited_by",
            foreignKey = @ForeignKey(name = "fk_meeting_summary_edited_by")
    )
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private UserEntity editedBy;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime updatedAt;
}
