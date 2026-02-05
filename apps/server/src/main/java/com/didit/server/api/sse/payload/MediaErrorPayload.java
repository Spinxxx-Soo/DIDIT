package com.didit.server.api.sse.payload;

import com.didit.server.api.response.ErrorResponse;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MediaErrorPayload implements ChannelEventPayload{
    private Long channelId;
    private ErrorResponse errorResponse;

    @Override
    public long getChannelId() {
        return channelId;
    }

    @Override
    public String getEventName() {
        return "media_error";
    }
}
