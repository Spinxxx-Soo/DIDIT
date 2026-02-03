package com.didit.server.api.redis;

import com.didit.server.api.response.AiResponse;
import com.didit.server.api.sse.SseHub;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisSortListener {
    private final SseHub sseHub;
    private final ObjectMapper objectMapper;

    public void onMessage(String message) {
        try {
            RedisSortListener.AiSortResult result = objectMapper.readValue(message, RedisSortListener.AiSortResult.class);

            sseHub.broadcastInProject(
                    result.projectId(),
                    "ai_sort_result",
                    "sort-" + System.currentTimeMillis(),
                    result.issueIds()
            );
        } catch (Exception e) {
            log.error("Failed to parse AI Sort Result: {}", e.getMessage());
        }

    }

    public record AiSortResult (
            Long projectId,
            List<Long> issueIds
    ){}
}
