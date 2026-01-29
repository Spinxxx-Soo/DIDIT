package com.didit.server.api.sse;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SseHub {

    private final Map<Long, Map<String, SseEmitter>> sseEmiterMap = new ConcurrentHashMap<>();
    private static final long EMITTER_TIMEOUT_MS = Duration.ofMinutes(30).toMillis();

    public SseEmitter subscribe(long channelId, String clientKey){
        SseEmitter sseEmitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        Map<String, SseEmitter> emitterMap = sseEmiterMap.computeIfAbsent(channelId, k -> new ConcurrentHashMap<>());
        emitterMap.put(clientKey, sseEmitter);

        sseEmitter.onCompletion(() -> remove(channelId, clientKey));
        sseEmitter.onTimeout(() -> remove(channelId, clientKey));
        sseEmitter.onError(throwable -> remove(channelId, clientKey));

        return sseEmitter;
    }

    public void broadcast(long channelId, String eventName, String eventId, Object payload) {
        Map<String, SseEmitter> emitterMap = sseEmiterMap.get(channelId);
        if (emitterMap == null) return;

        for (var entry : emitterMap.entrySet()) {
            try {
                entry.getValue().send(
                        SseEmitter.event().name(eventName).id(eventId).data(payload, MediaType.APPLICATION_JSON)
                );
            } catch (IOException e) {
                remove(channelId, entry.getKey());
            }
        }
    }

    public void remove(long channelId, String clientKey){
        Map<String, SseEmitter> map = sseEmiterMap.get(channelId);
        if (map != null) {
            map.remove(clientKey);
            if (map.isEmpty()) {
                sseEmiterMap.remove(channelId);
            }
        }
    }

    public void pingAll() {
        for (var channelEntry : sseEmiterMap.entrySet()) {
            long channelId = channelEntry.getKey();
            for (var clientEntry : channelEntry.getValue().entrySet()) {
                try {
                    clientEntry.getValue().send(SseEmitter.event().name("ping").data(""));
                } catch (IOException e) {
                    remove(channelId, clientEntry.getKey());
                }
            }
        }
    }
}
