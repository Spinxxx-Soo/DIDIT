// src/main/java/com/example/webhook/openvidu/OpenViduWebhookEvent.java
package com.didit.server.api.webhook.event;

import com.fasterxml.jackson.annotation.*;
import java.util.List;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "event",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = SessionCreatedEvent.class, name = "sessionCreated"),
        @JsonSubTypes.Type(value = SessionDestroyedEvent.class, name = "sessionDestroyed"),
        @JsonSubTypes.Type(value = ParticipantJoinedEvent.class, name = "participantJoined"),
        @JsonSubTypes.Type(value = ParticipantLeftEvent.class, name = "participantLeft"),
        @JsonSubTypes.Type(value = WebrtcConnectionCreatedEvent.class, name = "webrtcConnectionCreated"),
        @JsonSubTypes.Type(value = WebrtcConnectionDestroyedEvent.class, name = "webrtcConnectionDestroyed"),
        @JsonSubTypes.Type(value = RecordingStatusChangedEvent.class, name = "recordingStatusChanged"),
        @JsonSubTypes.Type(value = FilterEventDispatchedEvent.class, name = "filterEventDispatched"),
        @JsonSubTypes.Type(value = SignalSentEvent.class, name = "signalSent")
})
public sealed interface OpenViduWebhookEvent
        permits SessionCreatedEvent, SessionDestroyedEvent,
        ParticipantJoinedEvent, ParticipantLeftEvent,
        WebrtcConnectionCreatedEvent, WebrtcConnectionDestroyedEvent,
        RecordingStatusChangedEvent, FilterEventDispatchedEvent,
        SignalSentEvent {

    String event();
    long timestamp();
}

/* -------------------- Session -------------------- */

@JsonIgnoreProperties(ignoreUnknown = true)
record SessionCreatedEvent(
        String event,
        long timestamp,
        String sessionId
) implements OpenViduWebhookEvent {}

@JsonIgnoreProperties(ignoreUnknown = true)
record SessionDestroyedEvent(
        String event,
        long timestamp,
        String sessionId,
        long startTime,
        double duration,
        String reason
) implements OpenViduWebhookEvent {}

/* -------------------- Participant -------------------- */

@JsonIgnoreProperties(ignoreUnknown = true)
record ParticipantJoinedEvent(
        String event,
        long timestamp,
        String sessionId,
        String connectionId,
        String location,
        String ip,
        String platform,
        String clientData,
        String serverData
) implements OpenViduWebhookEvent {}

@JsonIgnoreProperties(ignoreUnknown = true)
record ParticipantLeftEvent(
        String event,
        long timestamp,
        String sessionId,
        long startTime,
        double duration,
        String reason,
        String connectionId,
        String location,
        String ip,
        String platform,
        String clientData,
        String serverData
) implements OpenViduWebhookEvent {}

/* -------------------- WebRTC Connection -------------------- */

@JsonIgnoreProperties(ignoreUnknown = true)
record WebrtcConnectionCreatedEvent(
        String event,
        long timestamp,
        String sessionId,
        String streamId,
        String connectionId,
        String connection,      // "INBOUND" | "OUTBOUND"
        String receivingFrom,   // INBOUND일 때 sender connectionId
        String videoSource,     // "CAMERA" | "SCREEN" | "CUSTOM" | "IPCAM"
        Integer videoFramerate,
        String videoDimensions, // 문서 예시: "{\"width\":1280,\"height\":720}"
        Boolean audioEnabled,
        Boolean videoEnabled
) implements OpenViduWebhookEvent {}

@JsonIgnoreProperties(ignoreUnknown = true)
record WebrtcConnectionDestroyedEvent(
        String event,
        long timestamp,
        String sessionId,
        long startTime,
        double duration,
        String reason,
        String streamId,
        String connectionId,
        String connection,
        String receivingFrom,
        String videoSource,
        Integer videoFramerate,
        String videoDimensions,
        Boolean audioEnabled,
        Boolean videoEnabled
) implements OpenViduWebhookEvent {}

/* -------------------- Recording -------------------- */

@JsonIgnoreProperties(ignoreUnknown = true)
record RecordingStatusChangedEvent(
        String event,
        long timestamp,
        String sessionId,
        long startTime,
        double duration,
        String reason,
        String id,
        String name,
        String outputMode,      // "COMPOSED" | "INDIVIDUAL"
        String resolution,
        String recordingLayout,
        Boolean hasAudio,
        Boolean hasVideo,
        Long size,
        String status           // "started" | "stopped" | "ready" | "failed"
) implements OpenViduWebhookEvent {}

/* -------------------- Filter & Signal -------------------- */

@JsonIgnoreProperties(ignoreUnknown = true)
record FilterEventDispatchedEvent(
        String event,
        long timestamp,
        String sessionId,
        String connectionId,
        String streamId,
        String filterType,
        String eventType,
        String data
) implements OpenViduWebhookEvent {}

@JsonIgnoreProperties(ignoreUnknown = true)
record SignalSentEvent(
        String event,
        long timestamp,
        String sessionId,
        @JsonSetter(nulls = Nulls.AS_EMPTY) // from=null 가능
        String from,
        List<String> to,
        String type,
        String data
) implements OpenViduWebhookEvent {}
