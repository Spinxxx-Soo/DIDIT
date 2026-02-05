package com.didit.server.api.sse.payload;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class MediaSummaryGeneratedPayload implements ProjectEventPayload {
    private long projectId;
    @Override
    public long getProjectId() {
        return projectId;
    }

    @Override
    public String getEventName() {
        return "media_summary_generated";
    }

    private long summaryId;
}
