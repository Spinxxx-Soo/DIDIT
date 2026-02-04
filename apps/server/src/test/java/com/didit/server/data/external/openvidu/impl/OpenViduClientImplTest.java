package com.didit.server.data.external.openvidu.impl;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.external.openvidu.dto.OpenViduConnectionRef;
import com.didit.server.data.external.openvidu.dto.OpenViduSessionRef;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.ResultError;
import com.didit.server.share.result.impl.ServerError;
import com.navercorp.fixturemonkey.FixtureMonkey;
import io.openvidu.java.client.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("OpenViduClientImpl 유닛 테스트")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.STRICT_STUBS)
class OpenViduClientImplTest {

    private final FixtureMonkey fixture = FixtureMonkey.builder().defaultNotNull(true).build();

    @Mock OpenVidu openVidu;

    @InjectMocks OpenViduClientImpl sut;

    /* ----------------------------------------------------------------------
     * createSession
     * ---------------------------------------------------------------------- */

    @Test
    @DisplayName("createSession: 정상 meetingEntity면 ok(OpenViduSessionRef)를 반환한다")
    void createSession_validMeeting_returnsOk() throws Exception {
        // Given
        String sessionId = "session-1";
        MeetingEntity meetingEntity = mock(MeetingEntity.class);
        when(meetingEntity.getSessionId()).thenReturn(sessionId);

        Session session = mock(Session.class);
        when(session.getSessionId()).thenReturn(sessionId);

        when(openVidu.createSession(any(SessionProperties.class))).thenReturn(session);

        // When
        Result<OpenViduSessionRef> result = sut.createSession(meetingEntity);

        // Then (Result 계약)
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getValue().isPresent());

        OpenViduSessionRef ref = result.getValue().orElseThrow();
        assertEquals(sessionId, ref.getSessionId());

        verify(openVidu, times(1)).createSession(any(SessionProperties.class));
        verifyNoMoreInteractions(openVidu);
    }

    @Test
    @DisplayName("createSession: openVidu 세션 생성 중 예외면 fail(500, ServerError[resource=exception])를 반환한다")
    void createSession_openViduThrows_returnsFailInternalServerError() throws Exception {
        // Given
        MeetingEntity meetingEntity = mock(MeetingEntity.class);
        when(meetingEntity.getSessionId()).thenReturn("session-1");

        RuntimeException ex = new RuntimeException("boom");
        when(openVidu.createSession(any(SessionProperties.class))).thenThrow(ex);

        // When
        Result<OpenViduSessionRef> result = sut.createSession(meetingEntity);

        // Then
        assertFailServerError(result, "exception", ex);

        verify(openVidu, times(1)).createSession(any(SessionProperties.class));
        verifyNoMoreInteractions(openVidu);
    }

    /* ----------------------------------------------------------------------
     * closeSession
     * ---------------------------------------------------------------------- */

    @Test
    @DisplayName("closeSession: 활성 세션이 존재하면 ok()를 반환한다")
    void closeSession_existingSession_returnsOk() throws Exception {
        // Given
        String sessionId = "session-1";
        Session session = mock(Session.class);

        when(openVidu.getActiveSession(sessionId)).thenReturn(session);

        // When
        Result<?> result = sut.closeSession(sessionId);

        // Then
        assertOkVoid(result);

        verify(openVidu, times(1)).getActiveSession(sessionId);
        verify(session, times(1)).close();
        verifyNoMoreInteractions(openVidu, session);
    }

    @Test
    @DisplayName("closeSession: 세션이 없으면 fail(500, ServerError[resource=세션을 찾을수가 없음])를 반환한다")
    void closeSession_sessionNotFound_returnsFailInternalServerError() {
        // Given
        String sessionId = "session-1";
        when(openVidu.getActiveSession(sessionId)).thenReturn(null);

        // When
        Result<?> result = sut.closeSession(sessionId);

        // Then
        assertFailServerError(result, "세션을 찾을수가 없음", sessionId);

        verify(openVidu, times(1)).getActiveSession(sessionId);
        verifyNoMoreInteractions(openVidu);
    }

    @Test
    @DisplayName("closeSession: 세션 close 중 예외면 fail(500, ServerError[resource=exception])를 반환한다")
    void closeSession_sessionCloseThrows_returnsFailInternalServerError() throws Exception {
        // Given
        String sessionId = "session-1";
        Session session = mock(Session.class);

        when(openVidu.getActiveSession(sessionId)).thenReturn(session);

        RuntimeException ex = new RuntimeException("close failed");
        doThrow(ex).when(session).close();

        // When
        Result<?> result = sut.closeSession(sessionId);

        // Then
        assertFailServerError(result, "exception", ex);

        verify(openVidu, times(1)).getActiveSession(sessionId);
        verify(session, times(1)).close();
        verifyNoMoreInteractions(openVidu, session);
    }

    /* ----------------------------------------------------------------------
     * createConnection
     * ---------------------------------------------------------------------- */

    @Test
    @DisplayName("createConnection: 세션이 존재하면 ok(OpenViduConnectionRef)를 반환한다")
    void createConnection_existingSession_returnsOk() throws Exception {
        // Given
        long userId = 10L;
        String sessionId = "session-1";

        UserEntity userEntity = mock(UserEntity.class);
        when(userEntity.getId()).thenReturn(userId);

        Session session = mock(Session.class);
        when(openVidu.getActiveSession(sessionId)).thenReturn(session);

        Connection connection = mock(Connection.class);
        when(connection.getConnectionId()).thenReturn("conn-1");

        when(session.createConnection(any())).thenReturn(connection);

        // When
        Result<OpenViduConnectionRef> result = sut.createConnection(userEntity, sessionId);

        // Then
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getValue().isPresent());

        OpenViduConnectionRef ref = result.getValue().orElseThrow();
        assertEquals("conn-1", ref.getConnectionId());

        verify(openVidu, times(1)).getActiveSession(sessionId);
        verify(session, times(1)).createConnection(any());
        verifyNoMoreInteractions(openVidu, session);
    }

    @Test
    @DisplayName("createConnection: 세션이 없으면 fail(500, ServerError[resource=세션을 찾을수가 없음])를 반환한다")
    void createConnection_sessionNotFound_returnsFailInternalServerError() {
        // Given
        String sessionId = "session-1";
        UserEntity userEntity = mock(UserEntity.class);

        when(openVidu.getActiveSession(sessionId)).thenReturn(null);

        // When
        Result<OpenViduConnectionRef> result = sut.createConnection(userEntity, sessionId);

        // Then
        assertFailServerError(result, "세션을 찾을수가 없음", sessionId);

        verify(openVidu, times(1)).getActiveSession(sessionId);
        verifyNoMoreInteractions(openVidu);
    }

    @Test
    @DisplayName("createConnection: 커넥션 생성 중 예외면 fail(500, ServerError[resource=exception])를 반환한다")
    void createConnection_sessionCreateConnectionThrows_returnsFailInternalServerError() throws Exception {
        // Given
        String sessionId = "session-1";
        UserEntity userEntity = mock(UserEntity.class);
        when(userEntity.getId()).thenReturn(1L);

        Session session = mock(Session.class);
        when(openVidu.getActiveSession(sessionId)).thenReturn(session);

        RuntimeException ex = new RuntimeException("createConnection failed");
        when(session.createConnection(any())).thenThrow(ex);

        // When
        Result<OpenViduConnectionRef> result = sut.createConnection(userEntity, sessionId);

        // Then
        assertFailServerError(result, "exception", ex);

        verify(openVidu, times(1)).getActiveSession(sessionId);
        verify(session, times(1)).createConnection(any());
        verifyNoMoreInteractions(openVidu, session);
    }

    /* ----------------------------------------------------------------------
     * closeConnection
     * ---------------------------------------------------------------------- */

    @Test
    @DisplayName("closeConnection: 세션/커넥션이 존재하면 ok()를 반환한다")
    void closeConnection_existingSessionAndConnection_returnsOk() throws Exception {
        // Given
        String sessionId = "session-1";
        String connectionId = "conn-1";

        Session session = mock(Session.class);
        when(openVidu.getActiveSession(sessionId)).thenReturn(session);

        Connection connection = mock(Connection.class);
        when(session.getConnection(connectionId)).thenReturn(connection);

        // When
        Result<?> result = sut.closeConnection(sessionId, connectionId);

        // Then
        assertOkVoid(result);

        verify(openVidu, times(1)).getActiveSession(sessionId);
        verify(session, times(1)).getConnection(connectionId);
        verify(session, times(1)).forceDisconnect(connection);
        verifyNoMoreInteractions(openVidu, session);
    }

    @Test
    @DisplayName("closeConnection: 세션이 없으면 fail(500, ServerError[resource=세션을 찾을수가 없음])를 반환한다")
    void closeConnection_sessionNotFound_returnsFailInternalServerError() {
        // Given
        String sessionId = "session-1";
        when(openVidu.getActiveSession(sessionId)).thenReturn(null);

        // When
        Result<?> result = sut.closeConnection(sessionId, "conn-1");

        // Then
        assertFailServerError(result, "세션을 찾을수가 없음", sessionId);

        verify(openVidu, times(1)).getActiveSession(sessionId);
        verifyNoMoreInteractions(openVidu);
    }

    @Test
    @DisplayName("closeConnection: 커넥션이 없으면 fail(500, ServerError[resource=커넥션을 찾을수가 없음])를 반환한다")
    void closeConnection_connectionNotFound_returnsFailInternalServerError() {
        // Given
        String sessionId = "session-1";
        String connectionId = "conn-1";

        Session session = mock(Session.class);
        when(openVidu.getActiveSession(sessionId)).thenReturn(session);
        when(session.getConnection(connectionId)).thenReturn(null);

        // When
        Result<?> result = sut.closeConnection(sessionId, connectionId);

        // Then
        assertFailServerError(result, "커넥션을 찾을수가 없음", connectionId);

        verify(openVidu, times(1)).getActiveSession(sessionId);
        verify(session, times(1)).getConnection(connectionId);
        verifyNoMoreInteractions(openVidu, session);
    }

    @Test
    @DisplayName("closeConnection: forceDisconnect 중 예외면 fail(500, ServerError[resource=exception])를 반환한다")
    void closeConnection_forceDisconnectThrows_returnsFailInternalServerError() throws Exception {
        // Given
        String sessionId = "session-1";
        String connectionId = "conn-1";

        Session session = mock(Session.class);
        when(openVidu.getActiveSession(sessionId)).thenReturn(session);

        Connection connection = mock(Connection.class);
        when(session.getConnection(connectionId)).thenReturn(connection);

        RuntimeException ex = new RuntimeException("disconnect failed");
        doThrow(ex).when(session).forceDisconnect(connection);

        // When
        Result<?> result = sut.closeConnection(sessionId, connectionId);

        // Then
        assertFailServerError(result, "exception", ex);

        verify(openVidu, times(1)).getActiveSession(sessionId);
        verify(session, times(1)).getConnection(connectionId);
        verify(session, times(1)).forceDisconnect(connection);
        verifyNoMoreInteractions(openVidu, session);
    }

    /* ----------------------------------------------------------------------
     * findConnections
     * ---------------------------------------------------------------------- */

    @Test
    @DisplayName("findConnections: 세션이 존재하면 ok(List<OpenViduConnectionRef>)를 반환한다")
    void findConnections_existingSession_returnsOk() {
        // Given
        String sessionId = "session-1";

        Session session = mock(Session.class);
        when(openVidu.getActiveSession(sessionId)).thenReturn(session);

        Connection c1 = mock(Connection.class);
        when(c1.getConnectionId()).thenReturn("conn-1");

        Connection c2 = mock(Connection.class);
        when(c2.getConnectionId()).thenReturn("conn-2");

        when(session.getConnections()).thenReturn(List.of(c1, c2));

        // When
        Result<List<OpenViduConnectionRef>> result = sut.findConnections(sessionId);

        // Then
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getValue().isPresent());

        List<OpenViduConnectionRef> refs = result.getValue().orElseThrow();
        assertEquals(2, refs.size());
        assertEquals("conn-1", refs.get(0).getConnectionId());
        assertEquals("conn-2", refs.get(1).getConnectionId());

        verify(openVidu, times(1)).getActiveSession(sessionId);
        verify(session, times(1)).getConnections();
        verifyNoMoreInteractions(openVidu, session);
    }

    @Test
    @DisplayName("findConnections: 세션이 없으면 fail(500, ServerError[resource=세션을 찾을수가 없음])를 반환한다")
    void findConnections_sessionNotFound_returnsFailInternalServerError() {
        // Given
        String sessionId = "session-1";
        when(openVidu.getActiveSession(sessionId)).thenReturn(null);

        // When
        Result<List<OpenViduConnectionRef>> result = sut.findConnections(sessionId);

        // Then
        assertFailServerError(result, "세션을 찾을수가 없음", sessionId);

        verify(openVidu, times(1)).getActiveSession(sessionId);
        verifyNoMoreInteractions(openVidu);
    }

    /* ----------------------------------------------------------------------
     * fetch
     * ---------------------------------------------------------------------- */

    @Test
    @DisplayName("fetch: 예외가 없으면 ok()를 반환한다")
    void fetch_noException_returnsOk() throws Exception {
        // Given (no stub needed)

        // When
        Result<?> result = sut.fetch();

        // Then
        assertOkVoid(result);

        verify(openVidu, times(1)).fetch();
        verifyNoMoreInteractions(openVidu);
    }

    @Test
    @DisplayName("fetch: openVidu.fetch 중 예외면 fail(500, ServerError[resource=exception])를 반환한다")
    void fetch_openViduThrows_returnsFailInternalServerError() throws Exception {
        // Given
        RuntimeException ex = new RuntimeException("fetch failed");
        doThrow(ex).when(openVidu).fetch();

        // When
        Result<?> result = sut.fetch();

        // Then
        assertFailServerError(result, "exception", ex);

        verify(openVidu, times(1)).fetch();
        verifyNoMoreInteractions(openVidu);
    }

    /* ---------------- startRecording ---------------- */

    @Test
    void startRecording_sessionNotFound_returnsFailServerError() throws OpenViduJavaClientException, OpenViduHttpException {
        // Given
        String sessionId = "sess-1";
        String recordName = fixture.giveMeOne(String.class);

        when(openVidu.getActiveSession(sessionId)).thenReturn(null);

        // When
        Result<?> result = sut.startRecording(sessionId, recordName);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMetadata(result, 500, Map.of("resource", "세션을 찾을수가 없음", "key", sessionId));
        verify(openVidu, never()).startRecording(anyString(), any(RecordingProperties.class));
    }

    @Test
    void startRecording_openViduThrows_returnsFailServerError() throws OpenViduJavaClientException, OpenViduHttpException {
        // Given
        String sessionId = "sess-1";
        String recordName = fixture.giveMeOne(String.class);

        when(openVidu.getActiveSession(sessionId)).thenReturn(mock(Session.class));

        RuntimeException ex = new RuntimeException("boom");
        when(openVidu.startRecording(eq(sessionId), any(RecordingProperties.class))).thenThrow(ex);

        // When
        Result<?> result = sut.startRecording(sessionId, recordName);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(openVidu).startRecording(eq(sessionId), any(RecordingProperties.class));
    }

    @Test
    void startRecording_validInputs_returnsOk() throws OpenViduJavaClientException, OpenViduHttpException {
        // Given
        String sessionId = "sess-1";
        String recordName = fixture.giveMeOne(String.class);

        when(openVidu.getActiveSession(sessionId)).thenReturn(mock(Session.class));
        when(openVidu.startRecording(eq(sessionId), any(RecordingProperties.class))).thenReturn(mock(Recording.class));

        // When
        Result<?> result = sut.startRecording(sessionId, recordName);

        // Then
        assertSuccessContract(result);
        assertTrue(result.getValue().isEmpty()); // ok()는 value=null
        verify(openVidu).startRecording(eq(sessionId), any(RecordingProperties.class));
    }

    /* ---------------- stopRecording ---------------- */

    @Test
    void stopRecording_recordingNotFound_returnsFailServerError() throws OpenViduJavaClientException, OpenViduHttpException {
        // Given
        String recordingId = "rec-1";

        RuntimeException ex = new RuntimeException("not found");
        when(openVidu.getRecording(recordingId)).thenThrow(ex);

        // When
        Result<?> result = sut.stopRecording(recordingId);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMetadata(result, 500, Map.of("resource", "세션을 찾을수가 없음", "key", recordingId));
        verify(openVidu, never()).stopRecording(anyString());
    }

    @Test
    void stopRecording_stopThrows_returnsFailServerError() throws OpenViduJavaClientException, OpenViduHttpException {
        // Given
        String recordingId = "rec-1";

        when(openVidu.getRecording(recordingId)).thenReturn(mock(Recording.class));

        RuntimeException ex = new RuntimeException("boom");
        when(openVidu.stopRecording(recordingId)).thenThrow(ex);

        // When
        Result<?> result = sut.stopRecording(recordingId);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(openVidu).stopRecording(recordingId);
    }

    @Test
    void stopRecording_validRecording_returnsOk() throws OpenViduJavaClientException, OpenViduHttpException {
        // Given
        String recordingId = "rec-1";

        when(openVidu.getRecording(recordingId)).thenReturn(mock(Recording.class));
        when(openVidu.stopRecording(recordingId)).thenReturn(mock(Recording.class));

        // When
        Result<?> result = sut.stopRecording(recordingId);

        // Then
        assertSuccessContract(result);
        assertTrue(result.getValue().isEmpty()); // ok()는 value=null
        verify(openVidu).stopRecording(recordingId);
    }



    /* ----------------------------------------------------------------------
     * helpers (Result 계약 / ServerError 고정)
     * ---------------------------------------------------------------------- */

    private void assertOkVoid(Result<?> result) {
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertTrue(result.getErrors().isEmpty());
        // ok()는 value=null 이므로 Optional empty가 자연스러움
        assertTrue(result.getValue().isEmpty());
    }

    private void assertFailServerError(Result<?> result, String expectedResource, Object expectedKey) {
        assertTrue(result.isFailure());
        assertFalse(result.isSuccess());
        assertNotNull(result.getErrors());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());

        ResultError error = result.getErrors().get(0);

        // (1) code/status 고정
        assertEquals(500, error.getCode());
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, error.getStatus());

        // (2) metadata 고정
        assertEquals(expectedResource, error.getMetadata().get("resource"));
        assertEquals(expectedKey, error.getMetadata().get("key"));

        // (3) type 고정(필요 시)
        assertInstanceOf(ServerError.class, error);
    }

    private static void assertSuccessContract(Result<?> result) {
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertNotNull(result.getErrors());
        assertTrue(result.getErrors().isEmpty());
    }

    private static void assertFailureContract(Result<?> result) {
        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertTrue(result.isFailure());
        assertNotNull(result.getErrors());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());
    }

    private static void assertSingleErrorCodeAndMetadata(Result<?> result, int code, Map<String, Object> expectedMetadataKVs) {
        assertEquals(1, result.getErrors().size());
        ResultError err = result.getSingleErrorOrThrow();

        assertEquals(code, err.getCode());

        // metadata 최소 2개 이상 고정 (code + metadata로 계약 검증)
        for (var entry : expectedMetadataKVs.entrySet()) {
            assertTrue(err.getMetadata().containsKey(entry.getKey()));
            Object expected = entry.getValue();
            Object actual = err.getMetadata().get(entry.getKey());

            if (expected instanceof Throwable) {
                assertSame(expected, actual);
            } else {
                assertEquals(expected, actual);
            }
        }
    }
}
