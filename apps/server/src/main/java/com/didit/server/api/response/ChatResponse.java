package com.didit.server.api.response;

import com.didit.server.data.entity.enums.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatResponse {
    private Long id;
    private Long userId;
    private MessageType messageType;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime editedAt;
}
