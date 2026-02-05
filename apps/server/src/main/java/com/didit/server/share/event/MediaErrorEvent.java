package com.didit.server.share.event;

import com.didit.server.api.response.ErrorResponse;

public record MediaErrorEvent(
        long channelId,
        ErrorResponse errorResponse
) {

}
