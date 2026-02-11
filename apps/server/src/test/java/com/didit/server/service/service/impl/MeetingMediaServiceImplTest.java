package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.MeetingUserEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.external.openvidu.OpenViduClient;
import com.didit.server.data.external.openvidu.dto.OpenViduConnectionRef;
import com.didit.server.data.external.openvidu.dto.OpenViduSessionRef;
import com.didit.server.data.repository.MeetingRecordRepository;
import com.didit.server.data.repository.MeetingRepository;
import com.didit.server.data.repository.MeetingUserRepository;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.ResultError;
import com.didit.server.share.result.impl.ServerError;
import com.navercorp.fixturemonkey.FixtureMonkey;
import io.openvidu.java.client.Connection;
import io.openvidu.java.client.Session;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MeetingMediaServiceImpl 유닛 테스트")
class MeetingMediaServiceImplTest {

    private final FixtureMonkey fixture = FixtureMonkey.builder().defaultNotNull(true).build();

    @Mock private OpenViduClient openViduClient;
    @Mock private MeetingRepository meetingRepository;
    @Mock private UserRepository userRepository;
    @Mock private MeetingUserRepository meetingUserRepository;
    @Mock private MeetingRecordRepository meetingRecordRepository;

    @InjectMocks private MeetingMediaServiceImpl sut;

    /* ---------------- createSession ---------------- */

    @Test
    void createSession_meetingNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.createSession(meetingId);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMetadata(result, 404, Map.of("resource", "meetingId", "key", meetingId));
        verifyNoInteractions(openViduClient);
    }

    @Test
    void createSession_fetchFail_returnsFailPropagateErrors() {
        // Given
        long meetingId = 1L;
        var meeting = meeting(meetingId, "sess-1");

        var ex = new RuntimeException("boom");
        var serverError = new ServerError("exception", ex);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(openViduClient.fetch()).thenReturn(Result.fail(serverError));

        // When
        Result<?> result = sut.createSession(meetingId);

        // Then
        assertFailureContract(result);
        assertHasErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(openViduClient).fetch();
        verify(openViduClient, never()).existSession(anyString());
        verify(openViduClient, never()).createSession(any());
    }

    @Test
    void createSession_sessionAlreadyExists_returnsOk() {
        // Given
        long meetingId = 1L;
        String sessionId = "sess-1";
        var meeting = meeting(meetingId, sessionId);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(true);

        // When
        Result<?> result = sut.createSession(meetingId);

        // Then
        assertSuccessContract(result);
        assertTrue(result.getValue().isEmpty()); // ok() (void)
        verify(openViduClient).fetch();
        verify(openViduClient).existSession(sessionId);
        verify(openViduClient, never()).createSession(any());
    }

    @Test
    void createSession_createSessionFail_returnsFailPropagateErrors() {
        // Given
        long meetingId = 1L;
        String sessionId = "sess-1";
        var meeting = meeting(meetingId, sessionId);

        var ex = new RuntimeException("boom");
        var serverError = new ServerError("exception", ex);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(false);
        when(openViduClient.createSession(meeting)).thenReturn(Result.fail(List.of(serverError)));

        // When
        Result<?> result = sut.createSession(meetingId);

        // Then
        assertFailureContract(result);
        assertHasErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(openViduClient).createSession(meeting);
    }

    @Test
    void createSession_newSession_returnsOk() {
        // Given
        long meetingId = 1L;
        String sessionId = "sess-1";
        var meeting = meeting(meetingId, sessionId);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(false);
        when(openViduClient.createSession(meeting)).thenReturn(Result.ok(new OpenViduSessionRef(mock(Session.class))));

        // When
        Result<?> result = sut.createSession(meetingId);

        // Then
        assertSuccessContract(result);
        assertTrue(result.getValue().isEmpty()); // ok() (void)
        verify(openViduClient).createSession(meeting);
    }

    /* ---------------- createConnection ---------------- */

    @Test
    void createConnection_meetingNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.empty());

        // When
        var result = sut.createConnection(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMetadata(result, 404, Map.of("resource", "meetingId", "key", meetingId));
        verifyNoInteractions(openViduClient);
    }

    @Test
    void createConnection_userNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        var meeting = meeting(meetingId, "sess-1");

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When
        var result = sut.createConnection(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMetadata(result, 404, Map.of("resource", "userId", "key", userId));
        verifyNoInteractions(openViduClient);
    }

    @Test
    void createConnection_fetchFail_returnsFailPropagateErrors() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        var meeting = meeting(meetingId, "sess-1");
        var user = user(userId);

        var ex = new RuntimeException("boom");
        var serverError = new ServerError("exception", ex);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(openViduClient.fetch()).thenReturn(Result.fail(serverError));

        // When
        var result = sut.createConnection(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertHasErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(openViduClient).fetch();
        verify(openViduClient, never()).existSession(anyString());
        verify(openViduClient, never()).createSession(any());
        verify(openViduClient, never()).createConnection(any(), anyString());
    }

    @Test
    void createConnection_sessionMissing_createSessionFail_returnsFailPropagateErrors() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String sessionId = "sess-1";

        var meeting = meeting(meetingId, sessionId);
        var user = user(userId);

        var ex = new RuntimeException("boom");
        var serverError = new ServerError("exception", ex);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(false);
        when(openViduClient.createSession(meeting)).thenReturn(Result.fail(serverError));

        // When
        var result = sut.createConnection(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertHasErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(openViduClient).createSession(meeting);
        verify(openViduClient, never()).createConnection(any(), anyString());
    }

    @Test
    void createConnection_openViduCreateConnectionFail_returnsFailPropagateErrors() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String sessionId = "sess-1";

        var meeting = meeting(meetingId, sessionId);
        var user = user(userId);

        var ex = new RuntimeException("boom");
        var serverError = new ServerError("exception", ex);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(true);
        when(openViduClient.createConnection(user, sessionId)).thenReturn(Result.fail(serverError));

        // When
        var result = sut.createConnection(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertHasErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(openViduClient).createConnection(user, sessionId);
    }

    @Test
    void createConnection_sessionExists_returnsOkWithToken() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String sessionId = "sess-1";
        String token = "token-abc";

        var meeting = meeting(meetingId, sessionId);
        var user = user(userId);

        var conn = mock(Connection.class);
        when(conn.getToken()).thenReturn(token);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(true);
        when(openViduClient.createConnection(user, sessionId)).thenReturn(Result.ok(new OpenViduConnectionRef(conn)));

        // When
        var result = sut.createConnection(meetingId, userId);

        // Then
        assertSuccessContract(result);
        assertTrue(result.getValue().isPresent());
        assertEquals(token, result.getOrThrow().token());
        verify(openViduClient, never()).createSession(any());
        verify(openViduClient).createConnection(user, sessionId);
    }

    @Test
    void createConnection_sessionMissing_createsSessionAndReturnsOkWithToken() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String sessionId = "sess-1";
        String token = "token-abc";

        var meeting = meeting(meetingId, sessionId);
        var user = user(userId);

        var conn = mock(Connection.class);
        when(conn.getToken()).thenReturn(token);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(false);
        when(openViduClient.createSession(meeting)).thenReturn(Result.ok(new OpenViduSessionRef(mock(Session.class))));
        when(openViduClient.createConnection(user, sessionId)).thenReturn(Result.ok(new OpenViduConnectionRef(conn)));

        // When
        var result = sut.createConnection(meetingId, userId);

        // Then
        assertSuccessContract(result);
        assertEquals(token, result.getOrThrow().token());
        verify(openViduClient).createSession(meeting);
        verify(openViduClient).createConnection(user, sessionId);
    }

    /* ---------------- closeSession ---------------- */

    @Test
    void closeSession_meetingNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.closeSession(meetingId);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMetadata(result, 404, Map.of("resource", "meetingId", "key", meetingId));
        verifyNoInteractions(openViduClient);
    }

    @Test
    void closeSession_fetchFail_returnsFailPropagateErrors() {
        // Given
        long meetingId = 1L;
        var meeting = meeting(meetingId, "sess-1");

        var ex = new RuntimeException("boom");
        var serverError = new ServerError("exception", ex);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(openViduClient.fetch()).thenReturn(Result.fail(serverError));

        // When
        Result<?> result = sut.closeSession(meetingId);

        // Then
        assertFailureContract(result);
        assertHasErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(openViduClient).fetch();
        verify(openViduClient, never()).existSession(anyString());
        verify(openViduClient, never()).closeSession(anyString());
    }

    @Test
    void closeSession_sessionNotExists_returnsOk() {
        // Given
        long meetingId = 1L;
        String sessionId = "sess-1";
        var meeting = meeting(meetingId, sessionId);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(false);

        // When
        Result<?> result = sut.closeSession(meetingId);

        // Then
        assertSuccessContract(result);
        verify(openViduClient, never()).closeSession(anyString());
    }

    @Test
    void closeSession_closeFail_returnsFailPropagateErrors() {
        // Given
        long meetingId = 1L;
        String sessionId = "sess-1";
        var meeting = meeting(meetingId, sessionId);

        var ex = new RuntimeException("boom");
        var serverError = new ServerError("exception", ex);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(true);
        when(openViduClient.closeSession(sessionId)).thenReturn(Result.fail(serverError));

        // When
        Result<?> result = sut.closeSession(meetingId);

        // Then
        assertFailureContract(result);
        assertHasErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(openViduClient).closeSession(sessionId);
    }

    @Test
    void closeSession_valid_returnsOk() {
        // Given
        long meetingId = 1L;
        String sessionId = "sess-1";
        var meeting = meeting(meetingId, sessionId);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(true);
        when(openViduClient.closeSession(sessionId)).thenReturn(Result.ok());

        // When
        Result<?> result = sut.closeSession(meetingId);

        // Then
        assertSuccessContract(result);
        verify(openViduClient).closeSession(sessionId);
    }

    /* ---------------- closeConnection ---------------- */

    @Test
    void closeConnection_meetingNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.closeConnection(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMetadata(result, 404, Map.of("resource", "meetingId", "key", meetingId));
        verifyNoInteractions(openViduClient);
    }

    @Test
    void closeConnection_userNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        var meeting = meeting(meetingId, "sess-1");

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.closeConnection(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMetadata(result, 404, Map.of("resource", "userId", "key", userId));
        verifyNoInteractions(openViduClient);
    }

    @Test
    void closeConnection_meetingUserNotFound_returnsFailConflict() {
        // Given
        long meetingId = 1L;
        long userId = 10L;

        var meeting = meeting(meetingId, "sess-1");
        var user = user(userId);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(meetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.closeConnection(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMessageContains(result, 409, "연결되어있지 않은 커넥션");
        verifyNoInteractions(openViduClient);
    }

    @Test
    void closeConnection_fetchFail_returnsFailPropagateErrors() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String token = "token-abc";

        var meeting = meeting(meetingId, "sess-1");
        var user = user(userId);
        var meetingUser = meetingUser(meeting, user, token);

        var ex = new RuntimeException("boom");
        var serverError = new ServerError("exception", ex);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(meetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId)).thenReturn(Optional.of(meetingUser));
        when(openViduClient.fetch()).thenReturn(Result.fail(serverError));

        // When
        Result<?> result = sut.closeConnection(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertHasErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(openViduClient).fetch();
        verify(openViduClient, never()).existSession(anyString());
        verify(openViduClient, never()).findConnections(anyString());
        verify(openViduClient, never()).closeConnection(anyString(), anyString());
    }

    @Test
    void closeConnection_sessionNotExists_returnsOk() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String sessionId = "sess-1";
        String token = "token-abc";

        var meeting = meeting(meetingId, sessionId);
        var user = user(userId);
        var meetingUser = meetingUser(meeting, user, token);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(meetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId)).thenReturn(Optional.of(meetingUser));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(false);

        // When
        Result<?> result = sut.closeConnection(meetingId, userId);

        // Then
        assertSuccessContract(result);
        verify(openViduClient, never()).findConnections(anyString());
        verify(openViduClient, never()).closeConnection(anyString(), anyString());
    }

    @Test
    void closeConnection_findConnectionsFail_returnsFailPropagateErrors() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String sessionId = "sess-1";
        String token = "token-abc";

        var meeting = meeting(meetingId, sessionId);
        var user = user(userId);
        var meetingUser = meetingUser(meeting, user, token);

        var ex = new RuntimeException("boom");
        var serverError = new ServerError("exception", ex);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(meetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId)).thenReturn(Optional.of(meetingUser));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(true);
        when(openViduClient.findConnections(sessionId)).thenReturn(Result.fail(serverError));

        // When
        Result<?> result = sut.closeConnection(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertHasErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(openViduClient).findConnections(sessionId);
        verify(openViduClient, never()).closeConnection(anyString(), anyString());
    }

    @Test
    void closeConnection_targetNotFound_returnsFailConflict() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String sessionId = "sess-1";
        String token = "token-abc";

        var meeting = meeting(meetingId, sessionId);
        var user = user(userId);
        var meetingUser = meetingUser(meeting, user, token);

        var otherConn = mock(Connection.class);
        when(otherConn.getConnectionId()).thenReturn("other-token");

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(meetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId)).thenReturn(Optional.of(meetingUser));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(true);
        when(openViduClient.findConnections(sessionId)).thenReturn(Result.ok(List.of(new OpenViduConnectionRef(otherConn))));

        // When
        Result<?> result = sut.closeConnection(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMessageContains(result, 409, "연결되어있지 않은 커넥션");
        verify(openViduClient, never()).closeConnection(anyString(), anyString());
    }


    @Test
    void closeConnection_valid_returnsOk() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String sessionId = "sess-1";
        String token = "token-abc";
        String connectionId = "conn-1";

        var meeting = meeting(meetingId, sessionId);
        var user = user(userId);
        var meetingUser = meetingUser(meeting, user, token);

        var target = mock(Connection.class);
        when(target.getConnectionId()).thenReturn(token);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(meetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId)).thenReturn(Optional.of(meetingUser));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(true);
        when(openViduClient.findConnections(sessionId)).thenReturn(Result.ok(List.of(new OpenViduConnectionRef(target))));
        when(openViduClient.closeConnection(sessionId, token)).thenReturn(Result.ok());

        // When
        Result<?> result = sut.closeConnection(meetingId, userId);

        // Then
        assertSuccessContract(result);
    }

    /* ---------------- getConnectedUsers ---------------- */

    @Test
    void getConnectedUsers_meetingNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        when(meetingRepository.findById(meetingId)).thenReturn(Optional.empty());

        // When
        Result<List<UserEntity>> result = sut.getConnectedUsers(meetingId);

        // Then
        assertFailureContract(result);
        assertSingleErrorCodeAndMetadata(result, 404, Map.of("resource", "meetingId", "key", meetingId));
        verifyNoInteractions(openViduClient);
    }

    @Test
    void getConnectedUsers_fetchFail_returnsFailPropagateErrors() {
        // Given
        long meetingId = 1L;
        var meeting = meeting(meetingId, "sess-1");

        var ex = new RuntimeException("boom");
        var serverError = new ServerError("exception", ex);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(openViduClient.fetch()).thenReturn(Result.fail(serverError));

        // When
        Result<List<UserEntity>> result = sut.getConnectedUsers(meetingId);

        // Then
        assertFailureContract(result);
        assertHasErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(openViduClient, never()).existSession(anyString());
        verify(openViduClient, never()).findConnections(anyString());
        verify(meetingUserRepository, never()).findAllByTokenInFetchUser(any());
    }

    @Test
    void getConnectedUsers_sessionNotExists_returnsOkWithEmptyList() {
        // Given
        long meetingId = 1L;
        String sessionId = "sess-1";
        var meeting = meeting(meetingId, sessionId);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(false);

        // When
        Result<List<UserEntity>> result = sut.getConnectedUsers(meetingId);

        // Then
        assertSuccessContract(result);
        assertTrue(result.getValue().isPresent());
        assertEquals(List.of(), result.getOrThrow());
        verify(openViduClient, never()).findConnections(anyString());
        verify(meetingUserRepository, never()).findAllByTokenInFetchUser(any());
    }

    @Test
    void getConnectedUsers_findConnectionsFail_returnsFailPropagateErrors() {
        // Given
        long meetingId = 1L;
        String sessionId = "sess-1";
        var meeting = meeting(meetingId, sessionId);

        var ex = new RuntimeException("boom");
        var serverError = new ServerError("exception", ex);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(true);
        when(openViduClient.findConnections(sessionId)).thenReturn(Result.fail(serverError));

        // When
        Result<List<UserEntity>> result = sut.getConnectedUsers(meetingId);

        // Then
        assertFailureContract(result);
        assertHasErrorCodeAndMetadata(result, 500, Map.of("resource", "exception", "key", ex));
        verify(meetingUserRepository, never()).findAllByTokenInFetchUser(any());
    }

    @Test
    void getConnectedUsers_valid_returnsOkWithDistinctUsers() {
        // Given
        long meetingId = 1L;
        String sessionId = "sess-1";

        String t1 = "token-1";
        String t2 = "token-2";

        var meeting = meeting(meetingId, sessionId);

        var c1 = mock(Connection.class);
        when(c1.getConnectionId()).thenReturn(t1);
        var c2 = mock(Connection.class);
        when(c1.getConnectionId()).thenReturn(t2);

        var user1 = user(10L);
        var user2 = user(20L);

        // distinct() 검증을 위해 user1 인스턴스 재사용
        var mu1 = meetingUser(meeting, user1, t1);
        var mu2 = meetingUser(meeting, user1, t2);
        var mu3 = meetingUser(meeting, user2, t2);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(openViduClient.fetch()).thenReturn(Result.ok());
        when(openViduClient.existSession(sessionId)).thenReturn(true);
        when(openViduClient.findConnections(sessionId)).thenReturn(Result.ok(List.of(
                new OpenViduConnectionRef(c1),
                new OpenViduConnectionRef(c2)
        )));
        when(meetingUserRepository.findAllByTokenInFetchUser(any())).thenReturn(List.of(mu1, mu2, mu3));

        // When
        Result<List<UserEntity>> result = sut.getConnectedUsers(meetingId);

        // Then
        assertSuccessContract(result);
        var users = result.getOrThrow();
        assertEquals(2, users.size());
        assertTrue(users.contains(user1));
        assertTrue(users.contains(user2));
    }

    /* ---------------- fixtures ---------------- */

    private MeetingEntity meeting(long meetingId, String sessionId) {
        return fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .set("sessionId", sessionId)
                // LAZY/관계 필드는 테스트에 불필요 + 순환참조 위험 방지
                .setNull("project")
                .setNull("createdBy")
                .sample();
    }

    private UserEntity user(long userId) {
        return fixture.giveMeBuilder(UserEntity.class)
                .set("id", userId)
                .sample();
    }

    private MeetingUserEntity meetingUser(MeetingEntity meeting, UserEntity user, String token) {
        return fixture.giveMeBuilder(MeetingUserEntity.class)
                .set("meeting", meeting)
                .set("user", user)
                .set("token", token)
                .sample();
    }

    /* ---------------- Result contract helpers ---------------- */

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

        for (var entry : expectedMetadataKVs.entrySet()) {
            assertTrue(err.getMetadata().containsKey(entry.getKey()));
            assertEquals(entry.getValue(), err.getMetadata().get(entry.getKey()));
        }
    }

    private static void assertSingleErrorCodeAndMessageContains(Result<?> result, int code, String messageContains) {
        assertEquals(1, result.getErrors().size());
        ResultError err = result.getSingleErrorOrThrow();
        assertEquals(code, err.getCode());
        assertNotNull(err.getMessage());
        assertTrue(err.getMessage().contains(messageContains));
    }

    private static void assertHasErrorCodeAndMetadata(Result<?> result, int code, Map<String, Object> expectedMetadataKVs) {
        assertTrue(result.getErrors().stream().anyMatch(err -> {
            if (err.getCode() != code) return false;

            for (var entry : expectedMetadataKVs.entrySet()) {
                if (!err.getMetadata().containsKey(entry.getKey())) return false;

                Object expected = entry.getValue();
                Object actual = err.getMetadata().get(entry.getKey());

                // Throwable은 same까지는 강제하지 않고, 동일 인스턴스면 더 좋음
                if (expected instanceof Throwable) {
                    if (actual != expected) return false;
                } else {
                    if (expected != null && !expected.equals(actual)) return false;
                }
            }
            return true;
        }));
    }
}
