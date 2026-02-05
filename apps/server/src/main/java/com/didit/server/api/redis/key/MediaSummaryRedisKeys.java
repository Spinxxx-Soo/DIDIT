package com.didit.server.api.redis.key;

import lombok.NoArgsConstructor;

@NoArgsConstructor
public final class MediaSummaryRedisKeys {
    public static final String MEDIA_SUMMARY_DOWNLOAD_PUSH = "queue:media:summary:download";
    public static final String MEDIA_SUMMARY_GENERATED_SUB = "media:summary:generated";
}
