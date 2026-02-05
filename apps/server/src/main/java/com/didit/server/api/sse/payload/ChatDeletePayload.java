package com.didit.server.api.sse.payload;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class ChatDeletePayload implements ChannelEventPayload{
    @JsonIgnore
    private long channelId;

    private long chatId;
    private String content;

    @Override
    public long getChannelId() {
        return channelId;
    }

    @Override
    public String getEventName() {
        return "chat_delete";
    }
}

