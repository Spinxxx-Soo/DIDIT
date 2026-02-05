package com.didit.server.api.scheduling;

import com.didit.server.service.service.MeetingMediaRecordingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

import static com.didit.server.api.redis.key.RecordingStopKeys.STOP_SCHEDULED_ZSET;


@Slf4j
@Component
@RequiredArgsConstructor
public class RecordingStopPoller {

    private final StringRedisTemplate redis;
    private final DefaultRedisScript<List> popDueRecordingIdsScript;
    private final MeetingMediaRecordingService meetingMediaRecordingService;

    private static final int BATCH_SIZE = 200;

    // stop 실패 시 재시도 예약
    private static final long RETRY_DELAY_MS = 3000L;

    @Scheduled(fixedDelay = 200) // 100~1000ms로 조절
    public void pollAndStop() {
        long now = Instant.now().toEpochMilli();

        @SuppressWarnings("unchecked")
        var recordingIds = (List<String>) redis.execute(
                popDueRecordingIdsScript,
                List.of(STOP_SCHEDULED_ZSET),
                String.valueOf(now),
                String.valueOf(BATCH_SIZE)
        );

        if (recordingIds == null || recordingIds.isEmpty()) return;

        for (String recordingId : recordingIds) {
            var id = Long.parseLong(recordingId);
            var stopResult = meetingMediaRecordingService.StopRecording(id);
            if (stopResult.isFailure()) {
                long retryAt = System.currentTimeMillis() + RETRY_DELAY_MS;
                redis.opsForZSet().add(STOP_SCHEDULED_ZSET, recordingId, (double) retryAt);
                log.warn("StopRecording FAILED -> retry scheduled: recordingId={}, retryAt={}", recordingId, retryAt);
                continue;
            }
            log.info("StopRecording OK: recordingId={}", recordingId);
        }
    }
}
