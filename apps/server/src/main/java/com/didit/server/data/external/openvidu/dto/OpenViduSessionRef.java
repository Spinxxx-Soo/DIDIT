package com.didit.server.data.external.openvidu.dto;

import io.openvidu.java.client.*;
import lombok.*;

@RequiredArgsConstructor
public final class OpenViduSessionRef{
    private final Session delegate;

    public Session raw() {
        return delegate;
    }

    public String getSessionId(){
        return delegate.getSessionId();
    }
}
