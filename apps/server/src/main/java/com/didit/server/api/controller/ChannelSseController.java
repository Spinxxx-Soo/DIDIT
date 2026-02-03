package com.didit.server.api.controller;

import com.didit.server.api.config.RedisConfig;
import com.didit.server.api.security.CustomOAuth2User;
import com.didit.server.api.sse.SseHub;
import com.didit.server.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ChannelSseController {

    private final SseHub sseHub;
    private final ChatService chatService;

    @GetMapping("/channels/{channelId}/stream")
    public SseEmitter subscribe(@PathVariable long channelId,
                                @AuthenticationPrincipal CustomOAuth2User user){
        long userId = user.getId();
        if (!chatService.checkMembership(channelId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "채널 구독 권한이 없습니다.");
        }
        String clientKey = sseHub.generateClientKey(userId);
        return sseHub.subscribe(channelId, clientKey);
    }

    @GetMapping("/projects/{projectId}/stream")
    public SseEmitter subscribeProject(@PathVariable long projectId,
                                       @AuthenticationPrincipal CustomOAuth2User user){
        long userId = user.getId();
        if (!chatService.checkMembership(projectId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "프로젝트 구독 권한이 없습니다.");
        }
        String clientKey = sseHub.generateClientKey(userId);
        return sseHub.subscribeProject(projectId, clientKey);
    }
}
