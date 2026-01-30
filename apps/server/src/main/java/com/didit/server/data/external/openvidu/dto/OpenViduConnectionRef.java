package com.didit.server.data.external.openvidu.dto;

import io.openvidu.java.client.Connection;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public final class OpenViduConnectionRef {
    private final Connection delegate;

    public Connection raw() { return delegate; }

    public String getConnectionId() { return delegate.getConnectionId(); }

    public String getToken() { return delegate.getToken(); }
}
