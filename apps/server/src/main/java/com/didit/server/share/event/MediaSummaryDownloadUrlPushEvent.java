package com.didit.server.share.event;

public record MediaSummaryDownloadUrlPushEvent(
        Long summaryId,
        String downloadUrl,
        Long projectId,
        Long meetingId
) {
}
