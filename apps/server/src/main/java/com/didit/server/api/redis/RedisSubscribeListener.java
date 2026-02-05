package com.didit.server.api.redis;

import com.didit.server.api.sse.SseHub;
import com.didit.server.service.service.IssueService;
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
    private final IssueService issueService;

    public void onMessage(String message) {
        try {
            log.info("RedisSubscribeListener - onMessage : {}", message);
            AiAnalysisResult result = objectMapper.readValue(message, AiAnalysisResult.class);
            String clientKey = (String) redisTemplate.opsForValue().get("sse:client_key:" + result.userId());
            var findResult = issueService.FindById(result.issueId);
            if (findResult.isFailure()){
                log.error(" RedisSubscribeListener - onMessage - Issue Not Found : {}", result.issueId);
            }
            var projectId = findResult.getOrThrow().getProject().getId();
            if (clientKey != null) {
                sseHub.broadcastToClient(
                        projectId,
                        clientKey,
                        "ai_analysis_result",
                        String.valueOf(result.issueId()),
                        result.priority()
                );
            }
        } catch (Exception e) {
            log.error("Redis 메시지 처리 중 에러 발생: {}", e.getMessage());
        }
    }

    public record AiAnalysisResult (
            Long userId,
            Long issueId,
            String priority
    ){}
}
