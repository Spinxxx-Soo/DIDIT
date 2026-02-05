package com.didit.server.service.command;

public record UpdateSummaryCommand(
        String title,
        String summaryMd
) {
}
