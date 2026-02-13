package com.didit.server.api.redis.payload;

import com.didit.server.api.redis.key.MediaSummaryRedisKeys;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MediaSummaryDownloadUrlPushPayload implements RedisPushPayload {
    @Override
    public String getKey() {
        return MediaSummaryRedisKeys.MEDIA_SUMMARY_DOWNLOAD_PUSH;
    }
    private Long summaryId;
    private String downloadUrl;
    private Long projectId;
    private Long meetingId;
}
