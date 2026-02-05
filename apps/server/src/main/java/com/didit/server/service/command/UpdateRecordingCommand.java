package com.didit.server.service.command;

import java.time.LocalDateTime;

public record UpdateRecordingCommand(
        LocalDateTime startedAt,
        LocalDateTime endAt
) {
}
