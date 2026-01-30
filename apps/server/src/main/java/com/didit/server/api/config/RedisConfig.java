package com.didit.server.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import tools.jackson.databind.ObjectMapper; // ✅ Boot 4/Jackson 3 기준

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory cf,
            ObjectMapper mapper
    ) {
        var template = new RedisTemplate<String, Object>();
        template.setConnectionFactory(cf);

        var keySer = new StringRedisSerializer();
        var valSer = new GenericJacksonJsonRedisSerializer(mapper);

        template.setKeySerializer(keySer);
        template.setHashKeySerializer(keySer);
        template.setValueSerializer(valSer);
        template.setHashValueSerializer(valSer);

        template.afterPropertiesSet();
        return template;
    }
}
