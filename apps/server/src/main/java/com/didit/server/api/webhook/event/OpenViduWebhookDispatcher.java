// src/main/java/com/example/webhook/openvidu/OpenViduWebhookDispatcher.java
package com.didit.server.api.webhook.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class OpenViduWebhookDispatcher {

    private final OpenViduWebhookHandler handler;

    // (선택) 빠른 200 응답을 위해 비동기 실행
    private final ThreadPoolTaskExecutor webhookExecutor = createDefaultExecutor();

    public void dispatch(OpenViduWebhookEvent e) {
        webhookExecutor.execute(() -> doDispatch(e));
    }

    private void doDispatch(OpenViduWebhookEvent e) {
        try {
            if (e instanceof SessionCreatedEvent ev) handler.onSessionCreated(ev);
            else if (e instanceof SessionDestroyedEvent ev) handler.onSessionDestroyed(ev);
            else if (e instanceof ParticipantJoinedEvent ev) handler.onParticipantJoined(ev);
            else if (e instanceof ParticipantLeftEvent ev) handler.onParticipantLeft(ev);
            else if (e instanceof WebrtcConnectionCreatedEvent ev) handler.onWebrtcConnectionCreated(ev);
            else if (e instanceof WebrtcConnectionDestroyedEvent ev) handler.onWebrtcConnectionDestroyed(ev);
            else if (e instanceof RecordingStatusChangedEvent ev) handler.onRecordingStatusChanged(ev);
            else if (e instanceof FilterEventDispatchedEvent ev) handler.onFilterEventDispatched(ev);
            else if (e instanceof SignalSentEvent ev) handler.onSignalSent(ev);
            else log.warn("Unhandled OpenVidu webhook event: {}", e.event());
        } catch (Exception ex) {
            log.error("OpenVidu webhook handling failed: event={}, payload={}", e.event(), e, ex);
        }
    }

    private ThreadPoolTaskExecutor createDefaultExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setThreadNamePrefix("openvidu-webhook-");
        ex.setCorePoolSize(4);
        ex.setMaxPoolSize(16);
        ex.setQueueCapacity(1000);
        ex.initialize();
        return ex;
    }
}
