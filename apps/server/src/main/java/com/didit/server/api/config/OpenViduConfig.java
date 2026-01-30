package com.didit.server.api.config;


import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(OpenViduProperties.class)
public class OpenViduConfig {

    @Bean
    public OpenVidu openVidu(OpenViduProperties props) throws OpenViduJavaClientException, OpenViduHttpException {
        var vidu =  new OpenVidu(props.url(), props.secret());
        vidu.fetch();
        return vidu;
    }
}
