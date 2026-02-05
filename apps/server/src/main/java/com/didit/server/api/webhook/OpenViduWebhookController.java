package com.didit.server.api.webhook;

import com.didit.server.api.config.OpenViduWebhookProperties;
import com.didit.server.api.webhook.event.OpenViduWebhookDispatcher;
import com.didit.server.api.webhook.event.OpenViduWebhookEvent;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/webhooks/openvidu")
public class OpenViduWebhookController {

    private static final String TOKEN_HEADER = "X-OpenVidu-Token";

    private final OpenViduWebhookDispatcher dispatcher;
    private final ObjectMapper objectMapper;
    private final OpenViduWebhookProperties props;

    /**
     * OpenVidu Server Webhook endpoint:
     * - must accept POST
     * - should respond 200 on every POST (otherwise OpenVidu just logs an error and moves on)
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> onWebhook(HttpServletRequest request) throws IOException {

        // (옵션) 간단한 헤더 토큰 검증: OPENVIDU_WEBHOOK_HEADERS에 맞춰서 사용
        if (StringUtils.hasText(props.getToken())) {
            String token = request.getHeader(TOKEN_HEADER);
            if (!props.getToken().equals(token)) {
                log.error("401");
                // 보안상 차단은 가능하지만, OpenVidu 쪽에는 전송 실패 로그가 남습니다.
                return ResponseEntity.status(401).build();
            }
        }

        // 바디 raw JSON 읽기 (한 번만 읽어야 함)
        String raw = request.getReader().lines().reduce("", (a, b) -> a + b);

        try {
            OpenViduWebhookEvent event = objectMapper.readValue(raw, OpenViduWebhookEvent.class);
            dispatcher.dispatch(event); // 비동기 처리 권장 (dispatcher 내부에서 처리)
        } catch (Exception e) {
            // 파싱 실패여도 OpenVidu는 "200 아닌 응답"보다 "200 + 내부 로깅"이 운영상 낫습니다.
            log.warn("OpenVidu webhook parse/dispatch failed. raw={}", raw, e);
        }

        return ResponseEntity.ok().build();
    }
}
