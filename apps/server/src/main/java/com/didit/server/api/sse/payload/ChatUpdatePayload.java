package com.didit.server.api.sse.payload;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class ChatUpdatePayload implements ChannelEventPayload {
    @JsonIgnore
    long channelId;

    long chatId;
    String content;
    String editedAt;

    @Override
    public long getChannelId() {
        return channelId;
    }

    @Override
    public String getEventName() {
        return "chat_update";
    }
}
