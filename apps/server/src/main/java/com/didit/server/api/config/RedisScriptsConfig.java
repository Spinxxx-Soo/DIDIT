package com.didit.server.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.script.DefaultRedisScript;

import java.util.List;

@Configuration
public class RedisScriptsConfig {

    /**
     * KEYS[1] = scheduled zset key
     * ARGV[1] = nowEpochMs
     * ARGV[2] = limit
     * return: recordingIds[]
     */
    @Bean
    public DefaultRedisScript<List> popDueRecordingIdsScript() {
        String lua = """
        local zkey = KEYS[1]
        local now = tonumber(ARGV[1])
        local limit = tonumber(ARGV[2])

        local items = redis.call('ZRANGEBYSCORE', zkey, '-inf', now, 'LIMIT', 0, limit)
        if #items > 0 then
          redis.call('ZREM', zkey, unpack(items))
        end
        return items
        """;

        DefaultRedisScript<List> script = new DefaultRedisScript<>();
        script.setScriptText(lua);
        script.setResultType(List.class);
        return script;
    }
}