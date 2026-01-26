package com.didit.server.service.command;

import com.didit.server.data.entity.enums.MeetingMode;

import java.time.LocalDateTime;

public record BookMeetingCommand(long projectId, long userId, String title, LocalDateTime start, LocalDateTime end) {
}
