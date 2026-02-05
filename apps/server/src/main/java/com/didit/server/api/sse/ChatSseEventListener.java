package com.didit.server.api.sse;

import com.didit.server.api.sse.payload.ChatDeletePayload;
import com.didit.server.api.sse.payload.ChatMessagePayload;
import com.didit.server.api.sse.payload.ChatUpdatePayload;
import com.didit.server.share.event.ChatMessageCreatedEvent;
import com.didit.server.share.event.ChatMessageDeletedEvent;
import com.didit.server.share.event.ChatMessageUpdatedEvent;
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
        sseHub.broadcast(payload);
    }

    @EventListener
    public void onUpdate(ChatMessageUpdatedEvent e) {
        var payload = ChatUpdatePayload.builder()
                .channelId(e.channelId())
                .content(e.content())
                .chatId(e.chatId())
                .editedAt(e.editedAt().toString())
                .build();
        sseHub.broadcast(payload);
    }

    @EventListener
    public void onDelete(ChatMessageDeletedEvent e) {
        var payload = new ChatDeletePayload(
                e.channelId(),
                e.chatId(),
                e.content()
        );
        sseHub.broadcast(payload);
    }


}
