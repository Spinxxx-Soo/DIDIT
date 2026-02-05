package com.didit.server.data.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "meeting_records",
        indexes = {
                @Index(name = "idx_meeting_records_meeting_id", columnList = "meeting_id"),
                @Index(name = "idx_meeting_records_created_by", columnList = "created_by"),
                @Index(name = "idx_meeting_records_created_at", columnList = "created_at")
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_meeting_records_recording_session_id",
                        columnNames = "recording_session_id"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"meeting", "createdBy"})
public class MeetingRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    // FK: meetings(id)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "meeting_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_meeting_records_meeting")
    )
    private MeetingEntity meeting;

    // FK: users(id)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "created_by",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_meeting_records_creator")
    )
    private UserEntity createdBy;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    @Column(name = "recording_session_id", length = 512)
    private String recordingSessionId;

    @Column(name = "recording_name", nullable = false, columnDefinition = "TEXT")
    private String recordingName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 녹화 종료 처리 */
    public void end(LocalDateTime endAt) {
        this.endAt = endAt;
    }

    /** OpenVidu(혹은 외부) 녹화 세션/레코딩 ID 저장 */
    public void assignRecordingSessionId(String recordingSessionId) {
        this.recordingSessionId = recordingSessionId;
    }
}
