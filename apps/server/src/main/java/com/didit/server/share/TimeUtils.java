package com.didit.server.share;

import java.time.*;

public final class TimeUtils {

    private TimeUtils() {}

    /**
     * UTC epoch milliseconds -> LocalDateTime (지정한 Zone 기준)
     *
     * @param epochMillis UTC 기준 epoch milliseconds
     * @param zone 변환할 타임존 (예: ZoneId.of("Asia/Seoul"))
     */
    public static LocalDateTime toLocalDateTime(long epochMillis, ZoneId zone) {
        return Instant.ofEpochMilli(epochMillis)
                .atZone(zone)
                .toLocalDateTime();
    }

    /**
     * UTC epoch milliseconds -> LocalDateTime (시스템 기본 Zone 기준)
     */
    public static LocalDateTime toLocalDateTime(long epochMillis) {
        return toLocalDateTime(epochMillis, ZoneId.of("Asia/Seoul"));
    }


    /**
     * LocalDateTime + Zone -> UTC epoch milliseconds
     * (역변환도 같이 두면 편함)
     */
    public static long toEpochMillis(LocalDateTime localDateTime, ZoneId zone) {
        return localDateTime.atZone(zone).toInstant().toEpochMilli();
    }
}
