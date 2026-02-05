package com.didit.server.api.redis;

import com.didit.server.api.redis.payload.RedisPushPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
public class RedisHub {
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public void push(String key, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            redisTemplate.opsForList().leftPush(key, json);
        } catch (Exception e) {
            throw new IllegalArgumentException("JSON serialize failed", e);
        }
    }

    public void push(RedisPushPayload payload){
        push(payload.getKey(), payload);
    }
}
