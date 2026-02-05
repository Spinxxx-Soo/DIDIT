package com.didit.server.api.sse.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ChatMessagePayload implements ChannelEventPayload {
    private long channelId;
    private long senderId;
    private String content;
    private long sentAtEpochMs;
    @Override
    public long getChannelId() {
        return channelId;
    }

    @Override
    public String getEventName() {
        return "message";
    }
}

