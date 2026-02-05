package com.didit.server.api.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "openvidu.webhook")
public class OpenViduWebhookProperties {
    /**
     * OPENVIDU_WEBHOOK_HEADERS 에서 같이 쓰는 토큰 값 (예: X-OpenVidu-Token)
     * 없으면 검증 생략
     */
    private String token;
}