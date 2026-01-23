package com.didit.server.service.service.dto.response;

import com.didit.server.data.entity.enums.MeetingStatus;

import java.time.LocalDateTime;

public record MeetingResponse(
        long meetingId,
        String title,
        MeetingStatus status,
        LocalDateTime startAt,
        LocalDateTime endAt,
        long participantsCount
) {}
