package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.MeetingUserEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.repository.MeetingRepository;
import com.didit.server.data.repository.MeetingUserRepository;
import com.didit.server.data.repository.ProjectUserRepository;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.ResultError;
import com.didit.server.share.result.impl.NotFoundError;
import com.navercorp.fixturemonkey.FixtureMonkey;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MeetingUserServiceImpl 유닛 테스트")
class MeetingUserServiceImplTest {

    private final FixtureMonkey fixture = FixtureMonkey.builder().defaultNotNull(true).build();

    @Mock
    private UserRepository _UserRepository;

    @Mock
    private ProjectUserRepository _ProjectUserRepository;

    @Mock
    private MeetingUserRepository _MeetingUserRepository;

    @Mock
    private MeetingRepository _MeetingRepository;

    @InjectMocks
    private MeetingUserServiceImpl sut;

    @Test
    void CreateMeetingUser_meetingNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        long userId = 2L;
        String token = "token-123";

        when(_MeetingRepository.findById(meetingId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.CreateMeetingUser(meetingId, userId, token);

        // Then
        assertTrue(result.isFailure());
        assertFalse(result.isSuccess());
        assertNotNull(result.getErrors());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());

        ResultError error = result.getErrors().get(0);
        assertInstanceOf(NotFoundError.class, error);
        assertEquals(404, error.getCode());
        assertEquals("meetingId", error.getMetadata().get("resource"));
        assertEquals(meetingId, error.getMetadata().get("key"));

        verify(_MeetingUserRepository, never()).saveAndFlush(any(MeetingUserEntity.class));
    }

    @Test
    void CreateMeetingUser_userNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 10L;
        long userId = 20L;
        String token = "token-abc";

        MeetingEntity meeting = fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .sample();

        when(_MeetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(_UserRepository.findById(userId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.CreateMeetingUser(meetingId, userId, token);

        // Then
        assertTrue(result.isFailure());
        assertFalse(result.isSuccess());
        assertNotNull(result.getErrors());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());

        ResultError error = result.getErrors().get(0);
        assertInstanceOf(NotFoundError.class, error);
        assertEquals(404, error.getCode());
        assertEquals("userId", error.getMetadata().get("resource"));
        assertEquals(userId, error.getMetadata().get("key"));

        verify(_MeetingUserRepository, never()).saveAndFlush(any(MeetingUserEntity.class));
    }

    @Test
    void CreateMeetingUser_validInputs_returnsOk() {
        // Given
        long meetingId = 100L;
        long userId = 200L;
        String token = "token-ok";

        MeetingEntity meeting = fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .sample();

        UserEntity user = fixture.giveMeBuilder(UserEntity.class)
                .set("id", userId)
                .sample();

        when(_MeetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(_UserRepository.findById(userId)).thenReturn(Optional.of(user));

        ArgumentCaptor<MeetingUserEntity> captor = ArgumentCaptor.forClass(MeetingUserEntity.class);

        // When
        Result<?> result = sut.CreateMeetingUser(meetingId, userId, token);

        // Then
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertNotNull(result.getErrors());
        assertTrue(result.getErrors().isEmpty());
        // ok()는 Result<Void>로 value가 없을 수 있음
        assertTrue(result.getValue().isEmpty());

        verify(_MeetingUserRepository, times(1)).saveAndFlush(captor.capture());
        MeetingUserEntity saved = captor.getValue();
        assertNotNull(saved);
        assertEquals(token, saved.getToken());
        assertSame(meeting, saved.getMeeting());
        assertSame(user, saved.getUser());
    }

    @Test
    void JoinMeeting_tokenNotFound_returnsFailNotFound() {
        // Given
        String token = "missing-token";
        when(_MeetingUserRepository.findByToken(token)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.JoinMeeting(token);

        // Then
        assertTrue(result.isFailure());
        assertFalse(result.isSuccess());
        assertNotNull(result.getErrors());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());

        ResultError error = result.getErrors().get(0);
        assertInstanceOf(NotFoundError.class, error);
        assertEquals(404, error.getCode());
        assertEquals("token", error.getMetadata().get("resource"));
        assertEquals(token, error.getMetadata().get("key"));

        verify(_MeetingUserRepository, never()).saveAndFlush(any(MeetingUserEntity.class));
    }

    @Test
    void JoinMeeting_validToken_returnsOk() {
        // Given
        String token = "join-token";

        MeetingUserEntity meetingUser = fixture.giveMeBuilder(MeetingUserEntity.class)
                .set("token", token)
                .setNull("joinedAt")
                .sample();

        when(_MeetingUserRepository.findByToken(token)).thenReturn(Optional.of(meetingUser));

        ArgumentCaptor<MeetingUserEntity> captor = ArgumentCaptor.forClass(MeetingUserEntity.class);

        LocalDateTime start = LocalDateTime.now();

        // When
        Result<?> result = sut.JoinMeeting(token);

        LocalDateTime end = LocalDateTime.now();

        // Then
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertNotNull(result.getErrors());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());

        verify(_MeetingUserRepository, times(1)).saveAndFlush(captor.capture());
        MeetingUserEntity saved = captor.getValue();
        assertNotNull(saved);
        assertEquals(token, saved.getToken());
        assertNotNull(saved.getJoinedAt());
        assertTrue(!saved.getJoinedAt().isBefore(start.minusSeconds(1)));
        assertTrue(!saved.getJoinedAt().isAfter(end.plusSeconds(1)));
    }

    @Test
    void leftMeeting_tokenNotFound_returnsFailNotFound() {
        // Given
        String token = "missing-left-token";
        when(_MeetingUserRepository.findByToken(token)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.leftMeeting(token);

        // Then
        assertTrue(result.isFailure());
        assertFalse(result.isSuccess());
        assertNotNull(result.getErrors());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());

        ResultError error = result.getErrors().get(0);
        assertInstanceOf(NotFoundError.class, error);
        assertEquals(404, error.getCode());
        assertEquals("token", error.getMetadata().get("resource"));
        assertEquals(token, error.getMetadata().get("key"));

        verify(_MeetingUserRepository, never()).saveAndFlush(any(MeetingUserEntity.class));
    }

    @Test
    void leftMeeting_validToken_returnsOk() {
        // Given
        String token = "left-token";

        MeetingUserEntity meetingUser = fixture.giveMeBuilder(MeetingUserEntity.class)
                .set("token", token)
                .setNull("leftAt")
                .sample();

        when(_MeetingUserRepository.findByToken(token)).thenReturn(Optional.of(meetingUser));

        ArgumentCaptor<MeetingUserEntity> captor = ArgumentCaptor.forClass(MeetingUserEntity.class);

        LocalDateTime start = LocalDateTime.now();

        // When
        Result<?> result = sut.leftMeeting(token);

        LocalDateTime end = LocalDateTime.now();

        // Then
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertNotNull(result.getErrors());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());

        verify(_MeetingUserRepository, times(1)).saveAndFlush(captor.capture());
        MeetingUserEntity saved = captor.getValue();
        assertNotNull(saved);
        assertEquals(token, saved.getToken());
        assertNotNull(saved.getLeftAt());
        assertTrue(!saved.getLeftAt().isBefore(start.minusSeconds(1)));
        assertTrue(!saved.getLeftAt().isAfter(end.plusSeconds(1)));
    }
}
