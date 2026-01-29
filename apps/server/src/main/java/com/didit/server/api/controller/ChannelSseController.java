package com.didit.server.api.controller;

import com.didit.server.api.security.CustomOAuth2User;
import com.didit.server.api.sse.SseHub;
import com.didit.server.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/channels")
@RequiredArgsConstructor
public class ChannelSseController {

    private final SseHub sseHub;
    private final ChatService chatService;

    @GetMapping("/{channelId}/stream")
    public SseEmitter subscribe(@PathVariable long channelId,
                                @AuthenticationPrincipal CustomOAuth2User user){
        long userId = user.getId();
        if (!chatService.checkMembership(channelId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "채널 구독 권한이 없습니다.");
        }
        String clientKey = userId + ":" + UUID.randomUUID().toString();
        return sseHub.subscribe(channelId, clientKey);
    }
}
