package com.didit.server.api.controller;

import com.didit.server.api.request.UpdateChatMessage;
import com.didit.server.api.response.ChatResponse;
import com.didit.server.api.security.CustomOAuth2User;
import com.didit.server.service.chat.ChatService;
import com.didit.server.service.chat.impl.ChatServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;

@RestController
@RequestMapping("/api/v1/channels")
@RequiredArgsConstructor
public class ChannelMessageController {

    private final ChatService chatService;

    public record SendMessageRequest(String content) {}

    @PostMapping("/{channelId}/chats")
    public ResponseEntity<?> sendMessage(@PathVariable long channelId,
                                  @AuthenticationPrincipal CustomOAuth2User user,
                                  @RequestBody SendMessageRequest req) {
        long userId = user.getId();
        var result = chatService.sendMessage(channelId, userId, req.content());
        if (result.isFailure()) {
            var err = result.getSingleErrorOrThrow();
            var response = err.getResponse();
            return new ResponseEntity<>(response, response.getStatusCode());
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{channelId}/chats")
    public ResponseEntity<?> getMessage(@PathVariable long channelId,
                                        @AuthenticationPrincipal CustomOAuth2User user,
                                        @RequestParam(required = false) Long lastId,
                                        @PageableDefault(size = 20) Pageable pageable){
        long userId = user.getId();
        var findMessage = chatService.getMessage(channelId, userId, lastId, pageable);
        if (findMessage.isFailure()) {
            var err = findMessage.getSingleErrorOrThrow();
            var response = err.getResponse();
            return new ResponseEntity<>(response, response.getStatusCode());
        }
        var entities = findMessage.getOrThrow();

        var response = entities.stream().map(x -> ChatResponse.builder()
                .id(x.getId())
                .userId(x.getUserId())
                .messageType(x.getMessageType())
                .message(x.getMessage())
                .createdAt(x.getCreatedAt())
                .editedAt(x.getEditedAt())
                .build()).sorted(Comparator.comparing(ChatResponse::getId))
                .toList();

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/chats/{chatId}")
    public ResponseEntity<?> updateMessage(@PathVariable long chatId,
                                           @AuthenticationPrincipal CustomOAuth2User user,
                                           @RequestBody UpdateChatMessage req){
        long userId = user.getId();
        var result = chatService.updateMessage(userId, chatId, req.content());
        if (result.isFailure()) {
            var err = result.getSingleErrorOrThrow();
            var response = err.getResponse();
            return new ResponseEntity<>(response, response.getStatusCode());
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/chats/{chatId}")
    public ResponseEntity<?> deleteMessage(@PathVariable long chatId,
                                           @AuthenticationPrincipal CustomOAuth2User user){
        long userId = user.getId();
        var result = chatService.deleteMessage(chatId, userId);
        if (result.isFailure()) {
            var err = result.getSingleErrorOrThrow();
            var response = err.getResponse();
            return new ResponseEntity<>(response, response.getStatusCode());
        }
        return ResponseEntity.ok().build();
    }
}
