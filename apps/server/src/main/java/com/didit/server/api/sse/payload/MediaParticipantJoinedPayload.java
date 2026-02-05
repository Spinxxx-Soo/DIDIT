package com.didit.server.api.sse.payload;

import co.elastic.clients.util.DateTime;
import com.didit.server.api.response.UserResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MediaParticipantJoinedPayload implements ChannelEventPayload{

    private long channelId;
    private LocalDateTime timestamp;
    private String sessionId;
    private String connectionId;
    private UserResponse user;
    @Override
    public long getChannelId() {
        return channelId;
    }

    @Override
    public String getEventName() {
        return "media_participant_joined";
    }
}
