package com.didit.server.api.redis;

import com.didit.server.api.response.AiResponse;
import com.didit.server.api.sse.SseHub;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisSubscribeListener {

    private final SseHub sseHub;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public void onMessage(String message) {
        try {
            AiAnalysisResult result = objectMapper.readValue(message, AiAnalysisResult.class);

            String clientKey = (String) redisTemplate.opsForValue().get("sse:client_key:" + result.userId());

            if (clientKey != null) {
                sseHub.broadcastToClient(
                        result.projectId(),
                        clientKey,
                        "ai_analysis_result",
                        String.valueOf(result.issueId()),
                        result.aiResponse()
                );
            }
        } catch (Exception e) {
            log.error("Redis 메시지 처리 중 에러 발생: {}", e.getMessage());
        }
    }

    public record AiAnalysisResult (
            Long userId,
            Long projectId,
            Long issueId,
            AiResponse aiResponse
    ){}
}
