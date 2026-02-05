package com.didit.server.data.external.openvidu.dto;

import io.openvidu.java.client.Recording;
import io.openvidu.java.client.Session;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public final class OpenViduRecordingRef {
    private final Recording delegate;

    public Recording raw() {
        return delegate;
    }

    public String getRecordingId(){
        return delegate.getId();
    }

    public String getDownloadUrl() {return delegate.getUrl(); }
}
