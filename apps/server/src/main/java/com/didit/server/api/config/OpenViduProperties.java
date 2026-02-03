package com.didit.server.api.config;


import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "openvidu")
public record OpenViduProperties(
        String url,
        String secret
) {}