package com.didit.server.api.scheduling;

import com.didit.server.api.sse.payload.MediaRecordingStartPayload;
import com.didit.server.share.TimeUtils;
import com.didit.server.share.event.MediaRecordingStartEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

import static com.didit.server.api.redis.key.RecordingStopKeys.STOP_SCHEDULED_ZSET;

@Service
@RequiredArgsConstructor
public class RecordingStopSchedulerService {

    private final StringRedisTemplate redis;

    public void scheduleStopAfter1Hour(Long recordingId) {
        long endAt = Instant.now().plus(Duration.ofHours(1)).toEpochMilli();
        scheduleStopAt(recordingId.toString(), endAt);
    }

    public void scheduleStopAt(String recordingId, long endAtEpochMs) {
        redis.opsForZSet().add(STOP_SCHEDULED_ZSET, recordingId, (double) endAtEpochMs);
    }

    @EventListener
    public void onMediaRecordingStartEvent(MediaRecordingStartEvent e) {
        scheduleStopAfter1Hour(e.recordId());
    }
}