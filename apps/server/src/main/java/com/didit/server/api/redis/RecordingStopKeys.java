package com.didit.server.api.redis;

public final class RecordingStopKeys {
    private RecordingStopKeys() {}

    // ZSET: member = recordingId, score = endAtEpochMs
    public static final String STOP_SCHEDULED_ZSET = "recording:stop:scheduled";
}