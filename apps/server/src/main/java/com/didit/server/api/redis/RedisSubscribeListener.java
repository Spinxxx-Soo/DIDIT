package com.didit.server.api.redis;

import com.didit.server.api.request.AiSortRequest;
import com.didit.server.api.response.AiResponse;
import com.didit.server.api.sse.SseHub;
import com.didit.server.data.entity.enums.IssuePriority;
import com.didit.server.data.repository.IssueRepository;
import com.didit.server.service.service.IssueService;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import static java.util.Arrays.stream;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisSubscribeListener {

    private final SseHub sseHub;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final IssueService issueService;
    private final IssueRepository issueRepository;

    public void onMessage(String message) {
        try {
            log.info("RedisSubscribeListener - onMessage : {}", message);
            AiAnalysisResult result = objectMapper.readValue(message, AiAnalysisResult.class);
            String clientKey = (String) redisTemplate.opsForValue().get("sse:client_key:" + result.userId());
            var findResult = issueService.FindById(result.issueId());
            if (findResult.isFailure()){
                log.error(" RedisSubscribeListener - onMessage - Issue Not Found : {}", result.issueId());
            }
            var projectId = findResult.getOrThrow().getProject().getId();
            if (clientKey != null) {
                IssuePriority priority;
                try {
                    priority = IssuePriority.valueOf(result.priority().toUpperCase());
                } catch (IllegalArgumentException e) {
                    priority = IssuePriority.MEDIUM;
                }
                findResult.getOrThrow().setPriority(priority);
                if (findResult.isFailure()){
                    log.error(" RedisSubscribeListener - onMessage - Issue Not Found : {}", result.issueId());
                    return;
                }
                issueRepository.save(findResult.getOrThrow());
                AiResponse aiResponse = AiResponse.builder()
                        .issueId(result.issueId())
                        .priority(priority)
                        .build();
                sseHub.broadcastToClient(
                        projectId,
                        clientKey,
                        "ai_analysis_result",
                        String.valueOf(result.issueId()),
                        aiResponse
                );
            }
            var allIssues = issueRepository.findAllByProject_Id(projectId);
            if (!allIssues.isEmpty()) {
                var issueInfos = allIssues.stream()
                        .map(i -> new AiSortRequest.AiIssueInfo(i.getId(), i.getTitle(), i.getBody(), i.getPriority().name()))
                        .toList();

                AiSortRequest sortRequest = new AiSortRequest(result.userId(), projectId, issueInfos);
                String sortPayload = objectMapper.writeValueAsString(sortRequest);

                redisTemplate.opsForList().leftPush("queue:issue:priority:sort", sortPayload);
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
