package com.didit.server.api.sse.payload;

import java.util.UUID;

public interface ProjectEventPayload {
    long getProjectId();

    default String getEventId(){
        return UUID.randomUUID().toString();
    }

    String getEventName();
}
