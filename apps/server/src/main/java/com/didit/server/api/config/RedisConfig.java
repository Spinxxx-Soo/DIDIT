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
    public MessageListenerAdapter issuePriorityResultAdapter(RedisSubscribeListener subscriber) {
        var adapter = new MessageListenerAdapter(subscriber, "onMessage");
        adapter.setSerializer(new StringRedisSerializer()); // String으로 받을 거면 추천
        adapter.afterPropertiesSet(); // 안전하게 명시
        return adapter;
    }

    @Bean
    public MessageListenerAdapter issuePrioritySortAdapter(RedisSortListener sortSubscriber) {
        var adapter = new MessageListenerAdapter(sortSubscriber, "onMessage");
        adapter.setSerializer(new StringRedisSerializer());
        adapter.afterPropertiesSet();
        return adapter;
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory cf,
            MessageListenerAdapter issuePriorityResultAdapter,
            MessageListenerAdapter issuePrioritySortAdapter
    ) {
        var container = new RedisMessageListenerContainer();
        container.setConnectionFactory(cf);

        container.addMessageListener(issuePriorityResultAdapter,
                new ChannelTopic("issue:priority:result_topic"));

        container.addMessageListener(issuePrioritySortAdapter,
                new ChannelTopic("issue:priority:sort_result_topic"));

        return container;
    }
}
