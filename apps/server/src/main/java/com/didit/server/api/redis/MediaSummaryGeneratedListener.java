package com.didit.server.api.redis;

import com.didit.server.api.redis.payload.MediaSummaryGeneratedPayload;
import com.didit.server.api.sse.SseHub;
import com.didit.server.service.service.MeetingSummaryService;
import com.didit.server.share.event.MediaSummaryGeneratedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@RequiredArgsConstructor
@Component
@Slf4j
public class MediaSummaryGeneratedListener {
    private final ObjectMapper objectMapper;
    private final MeetingSummaryService meetingSummaryService;
    private final ApplicationEventPublisher publisher;

    public void onMessage(String message) {
        log.info("MediaSummaryGeneratedListener - onMessage : {}", message);
        try {
            MediaSummaryGeneratedPayload result = objectMapper.readValue(message, MediaSummaryGeneratedPayload.class);
            var findResult = meetingSummaryService.FindById(result.summeryId());
            if (findResult.isFailure()) {
                log.error("Failed to FindById: {}", findResult.getSingleErrorOrThrow().getMessage());
                return;
            }
            var updateResult = meetingSummaryService.UpdateSummaryByAi(result.summeryId(),
                    result.summary());
            if (updateResult.isFailure()) {
                log.error("Failed to UpdateSummaryByAi: {}", updateResult.getSingleErrorOrThrow().getMessage());
                return;
            }
            var summary = findResult.getOrThrow();
            var event = new MediaSummaryGeneratedEvent(summary.getProject().getId(), summary.getId());
            publisher.publishEvent(event);
        } catch (Exception e) {
            log.error("Failed to parse MediaSummaryGenerated: {}", e.getMessage());
        }

    }
}
