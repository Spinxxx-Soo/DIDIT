package com.didit.server.api.sse.payload;

import co.elastic.clients.util.DateTime;
import com.didit.server.api.response.UserResponse;
import com.didit.server.data.entity.UserEntity;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MediaRecordingStopPayload implements ChannelEventPayload{
    private long channelId;
    private LocalDateTime timestamp;
    private String sessionId;

    @Override
    public long getChannelId() {
        return channelId;
    }

    @Override
    public String getEventName() {
        return "media_recording_stop";
    }
}
