package com.didit.server.api.sse.payload;

import lombok.Data;

import java.util.UUID;

public interface ChannelEventPayload {
    long getChannelId();

    default String getEventId(){
     return UUID.randomUUID().toString();
    }

    String getEventName();
}
