package com.didit.server.api.webhook.event;

public interface OpenViduWebhookHandler {
    void onSessionCreated(SessionCreatedEvent e);
    void onSessionDestroyed(SessionDestroyedEvent e);

    void onParticipantJoined(ParticipantJoinedEvent e);
    void onParticipantLeft(ParticipantLeftEvent e);

    void onWebrtcConnectionCreated(WebrtcConnectionCreatedEvent e);
    void onWebrtcConnectionDestroyed(WebrtcConnectionDestroyedEvent e);

    void onRecordingStatusChanged(RecordingStatusChangedEvent e);

    void onFilterEventDispatched(FilterEventDispatchedEvent e);
    void onSignalSent(SignalSentEvent e);
}
