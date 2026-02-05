package com.didit.server.api.response;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.MeetingSummaryEntity;
import com.didit.server.data.entity.ProjectEntity;
import com.didit.server.data.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
public class MeetingSummaryResponse {
    private Long id;
    private String title;
    private Long meetingId;
    private String summaryMd;
    private LocalDateTime publishedAt;
    private Integer summaryVersion;
    private UserResponse editedBy;
    private LocalDateTime generatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MeetingSummaryResponse fromEntity(MeetingSummaryEntity e){
        var user = e.getEditedBy() == null ? null : UserResponse.fromEntity(e.getEditedBy());
        var meetingId = e.getMeeting() == null ? null : e.getMeeting().getId();
        return MeetingSummaryResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .meetingId(meetingId)
                .summaryMd(e.getSummaryMd())
                .publishedAt(e.getPublishedAt())
                .summaryVersion(e.getSummaryVersion())
                .editedBy(user)
                .generatedAt(e.getGeneratedAt())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
