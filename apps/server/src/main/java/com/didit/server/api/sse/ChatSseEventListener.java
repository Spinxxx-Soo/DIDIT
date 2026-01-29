package com.didit.server.api.sse;

import com.didit.server.service.chat.event.ChatMessageCreatedEvent;
import com.didit.server.service.chat.event.ChatMessageDeletedEvent;
import com.didit.server.service.chat.event.ChatMessageUpdatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatSseEventListener {

    private final SseHub sseHub;

    @EventListener
    public void on(ChatMessageCreatedEvent e) {
        log.info("이벤트 리스너 도달: {}", e.content());
        var payload = new ChatMessagePayload(
                e.channelId(),
                e.userId(),
                e.content(),
                e.sentAtEpochMs()
        );
        log.info("브로드캐스트 시작: channelId={}", e.channelId());
        sseHub.broadcast(e.channelId(), "message", e.eventId(), payload);
    }

    @EventListener
    public void onUpdate(ChatMessageUpdatedEvent e) {
        var payload = new ChatUpdatePayload(
                e.chatId(),
                e.content(),
                e.editedAt().toString()
        );
        sseHub.broadcast(e.projectId(), "chat_update", e.chatId().toString(), payload);
    }

    @EventListener
    public void onDelete(ChatMessageDeletedEvent e) {
        var payload = new ChatDeletePayload(
                e.chatId(),
                e.content()
        );
        sseHub.broadcast(e.projectId(), "chat_delete", e.chatId().toString(), payload);
    }

    public record ChatMessagePayload(
            long channelId,
            long senderId,
            String content,
            long sentAtEpochMs
    ) {}

    public record ChatUpdatePayload(
            long chatId,
            String content,
            String editedAt
    ) {}

    public record ChatDeletePayload(
            long chatId,
            String content
    ) {}
}
