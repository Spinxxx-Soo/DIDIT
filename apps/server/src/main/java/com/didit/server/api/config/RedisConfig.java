package com.didit.server.api.config;

import com.didit.server.api.redis.RedisSortListener;
import com.didit.server.api.redis.RedisSubscribeListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import tools.jackson.databind.ObjectMapper;

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
        var valSer = new StringRedisSerializer();

        template.setKeySerializer(keySer);
        template.setHashKeySerializer(keySer);
        template.setValueSerializer(valSer);
        template.setHashValueSerializer(valSer);

        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListener(RedisConnectionFactory cf,
                                                              RedisSubscribeListener subscriber,
                                                              RedisSortListener sortSubscriber) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(cf);
        MessageListenerAdapter adapter = new MessageListenerAdapter(subscriber, "onMessage");
        container.addMessageListener(adapter, new ChannelTopic("issue:priority:result_topic"));
        MessageListenerAdapter sortAdapter = new MessageListenerAdapter(sortSubscriber, "onMessage");
        container.addMessageListener(sortAdapter, new ChannelTopic("issue:priority:sort_result_topic"));
        return container;
    }
}
