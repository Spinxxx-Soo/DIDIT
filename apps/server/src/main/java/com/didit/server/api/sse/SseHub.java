package com.didit.server.api.sse;

import com.didit.server.api.sse.payload.ChannelEventPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class SseHub {

    private final Map<Long, Map<String, SseEmitter>> sseEmiterMap = new ConcurrentHashMap<>();
    private static final long EMITTER_TIMEOUT_MS = Duration.ofMinutes(30).toMillis();
    private final Map<Long, Map<String, SseEmitter>> sseProjectEmiterMap = new ConcurrentHashMap<>();
    private final RedisTemplate<String, Object> redisTemplate;

    public SseEmitter subscribe(long channelId, String clientKey){
        SseEmitter sseEmitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        Map<String, SseEmitter> emitterMap = sseEmiterMap.computeIfAbsent(channelId, k -> new ConcurrentHashMap<>());
        emitterMap.put(clientKey, sseEmitter);

        sseEmitter.onCompletion(() -> remove(channelId, clientKey));
        sseEmitter.onTimeout(() -> remove(channelId, clientKey));
        sseEmitter.onError(throwable -> remove(channelId, clientKey));

        return sseEmitter;
    }

    public SseEmitter subscribeProject(long projectId, String clientKey){
        SseEmitter sseEmitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        Map<String, SseEmitter> projectEmiterMap = sseProjectEmiterMap.computeIfAbsent(projectId, k -> new ConcurrentHashMap<>());
        projectEmiterMap.put(clientKey, sseEmitter);

        sseEmitter.onCompletion(() -> removeProject(projectId, clientKey));
        sseEmitter.onTimeout(() -> removeProject(projectId, clientKey));
        sseEmitter.onError(throwable -> removeProject(projectId, clientKey));

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

    public void broadcast(ChannelEventPayload payload) {
        broadcast(payload.getChannelId(), payload.getEventName(), payload.getEventId(), payload);
    }

    public void broadcastInProject(long projectId, String eventName, String eventId, Object payload) {
        Map<String, SseEmitter> emitterMap = sseProjectEmiterMap.get(projectId);
        if (emitterMap == null) return;

        for (var entry : emitterMap.entrySet()) {
            try {
                entry.getValue().send(
                        SseEmitter.event().name(eventName).id(eventId).data(payload, MediaType.APPLICATION_JSON)
                );
            } catch (IOException e) {
                removeProject(projectId, entry.getKey());
            }
        }
    }

    public void broadcastToClient(long projectId, String clientKey, String eventName, String eventId, Object payload){
        Map<String, SseEmitter> emitterMap = sseProjectEmiterMap.get(projectId);
        if (emitterMap == null) return;
        SseEmitter emitter = emitterMap.get(clientKey);

        if (emitter != null) {
            try {
                emitter.send(
                        SseEmitter.event().name(eventName).id(eventId).data(payload, MediaType.APPLICATION_JSON)
                );
            } catch (IOException e) {
                removeProject(projectId, clientKey);
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

    public void removeProject(long projectId, String clientKey){
        Map<String, SseEmitter> map = sseProjectEmiterMap.get(projectId);
        if (map != null) {
            map.remove(clientKey);
            if (map.isEmpty()) {
                sseProjectEmiterMap.remove(projectId);
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
        for (var projectEntry : sseProjectEmiterMap.entrySet()) {
            long projectId = projectEntry.getKey();
            for (var clientEntry : projectEntry.getValue().entrySet()) {
                try {
                    clientEntry.getValue().send(SseEmitter.event().name("ping").data(""));
                } catch (IOException e) {
                    removeProject(projectId, clientEntry.getKey());
                }
            }
        }
    }

    public String generateClientKey(long userId){
        String clientKey = userId + ":" + UUID.randomUUID().toString();
        redisTemplate.opsForValue().set("sse:client_key:" + userId, clientKey, Duration.ofMinutes(30));
        return clientKey;
    }
}
