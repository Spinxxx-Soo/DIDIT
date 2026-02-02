package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.MeetingUserEntity;
import com.didit.server.data.entity.ProjectUserEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.repository.MeetingRepository;
import com.didit.server.data.repository.MeetingUserRepository;
import com.didit.server.data.repository.ProjectUserRepository;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.ForbiddenError;
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
import java.util.Objects;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MeetingUserServiceImpl 유닛 테스트")
class MeetingUserServiceImplTest {

    private final FixtureMonkey fixture = FixtureMonkey.builder().defaultNotNull(true).build();

    @Mock private UserRepository _UserRepository;
    @Mock private ProjectUserRepository _ProjectUserRepository;
    @Mock private MeetingUserRepository _MeetingUserRepository;
    @Mock private MeetingRepository _MeetingRepository;

    @InjectMocks private MeetingUserServiceImpl sut;

    @Test
    void joinMeeting_meetingNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String token = "token-1";

        when(_MeetingRepository.findById(meetingId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.joinMeeting(meetingId, userId, token);

        // Then
        assertFailureContract(result);
        assertHasNotFoundError(result, "meetingId", meetingId);
        verify(_MeetingUserRepository, never()).save(any());
    }

    @Test
    void joinMeeting_userNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String token = "token-1";
        long projectId = 99L;

        var meeting = fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .set("project.id", projectId) // ✅ NPE 방지 (중첩 필드 고정)
                .sample();

        when(_MeetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(_UserRepository.findById(userId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.joinMeeting(meetingId, userId, token);

        // Then
        assertFailureContract(result);
        assertHasNotFoundError(result, "userId", userId);
        verify(_MeetingUserRepository, never()).save(any());
    }

    @Test
    void joinMeeting_projectUserNotFound_returnsFailForbidden() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String token = "token-1";
        long projectId = 99L;

        var meeting = fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .set("project.id", projectId) // ✅ 핵심: meeting.getProject().getId()가 null이면 안 됨
                .sample();

        var user = fixture.giveMeBuilder(UserEntity.class)
                .set("id", userId)
                .sample();

        when(_MeetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(_UserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(_ProjectUserRepository.findByProject_IdAndUser_Id(projectId, userId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.joinMeeting(meetingId, userId, token);

        // Then
        assertFailureContract(result);
        assertHasForbiddenError(result, 403, "프로젝트");
        verify(_MeetingUserRepository, never()).save(any());
    }

    @Test
    void joinMeeting_newMeetingUser_returnsOkAndSaves() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String token = "token-1";
        long projectId = 99L;

        var meeting = fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .set("project.id", projectId) // ✅
                .sample();

        var user = fixture.giveMeBuilder(UserEntity.class)
                .set("id", userId)
                .sample();

        when(_MeetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(_UserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(_ProjectUserRepository.findByProject_IdAndUser_Id(projectId, userId))
                .thenReturn(Optional.of(mock(ProjectUserEntity.class)));
        when(_MeetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.joinMeeting(meetingId, userId, token);

        // Then
        assertSuccessVoidContract(result);

        var captor = ArgumentCaptor.forClass(MeetingUserEntity.class);
        verify(_MeetingUserRepository).save(captor.capture());
        var saved = captor.getValue();

        assertNotNull(saved);
        assertNotNull(saved.getMeeting());
        assertNotNull(saved.getUser());
        assertEquals(meetingId, saved.getMeeting().getId());
        assertEquals(userId, saved.getUser().getId());
        assertEquals(token, saved.getToken());
        assertNotNull(saved.getJoinedAt());
        assertNull(saved.getLeftAt());
    }

    @Test
    void joinMeeting_existingMeetingUser_returnsOkAndUpdatesToken() {
        // Given
        long meetingId = 1L;
        long userId = 10L;
        String token = "token-new";
        long projectId = 99L;

        var meeting = fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .set("project.id", projectId) // ✅
                .sample();

        var user = fixture.giveMeBuilder(UserEntity.class)
                .set("id", userId)
                .sample();

        LocalDateTime oldJoinedAt = LocalDateTime.of(2020, 1, 1, 0, 0);
        var existing = fixture.giveMeBuilder(MeetingUserEntity.class)
                .set("id", 123L)
                .set("meeting", meeting)
                .set("user", user)
                .set("token", "token-old")
                .set("joinedAt", oldJoinedAt)
                .setNull("leftAt")
                .sample();

        when(_MeetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(_UserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(_ProjectUserRepository.findByProject_IdAndUser_Id(projectId, userId))
                .thenReturn(Optional.of(mock(ProjectUserEntity.class)));
        when(_MeetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId)).thenReturn(Optional.of(existing));

        // When
        Result<?> result = sut.joinMeeting(meetingId, userId, token);

        // Then
        assertSuccessVoidContract(result);

        var captor = ArgumentCaptor.forClass(MeetingUserEntity.class);
        verify(_MeetingUserRepository).save(captor.capture());
        var saved = captor.getValue();

        assertEquals(existing.getId(), saved.getId());
        assertEquals(token, saved.getToken());
        assertNotNull(saved.getJoinedAt());
        assertTrue(saved.getJoinedAt().isAfter(oldJoinedAt));
    }

    @Test
    void leftMeeting_meetingNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        long userId = 10L;

        when(_MeetingRepository.findById(meetingId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.leftMeeting(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertHasNotFoundError(result, "meetingId", meetingId);
        verify(_MeetingUserRepository, never()).save(any());
    }

    @Test
    void leftMeeting_userNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        long userId = 10L;

        var meeting = fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .sample();

        when(_MeetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(_UserRepository.findById(userId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.leftMeeting(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertHasNotFoundError(result, "userId", userId);
        verify(_MeetingUserRepository, never()).save(any());
    }

    @Test
    void leftMeeting_meetingUserNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        long userId = 10L;

        var meeting = fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .sample();

        var user = fixture.giveMeBuilder(UserEntity.class)
                .set("id", userId)
                .sample();

        when(_MeetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(_UserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(_MeetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.leftMeeting(meetingId, userId);

        // Then
        assertFailureContract(result);
        assertHasNotFoundError(result, "userId", userId);
        verify(_MeetingUserRepository, never()).save(any());
    }

    @Test
    void leftMeeting_validInputs_returnsOkAndSaves() {
        // Given
        long meetingId = 1L;
        long userId = 10L;

        var meeting = fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .sample();

        var user = fixture.giveMeBuilder(UserEntity.class)
                .set("id", userId)
                .sample();

        var meetingUser = fixture.giveMeBuilder(MeetingUserEntity.class)
                .set("meeting", meeting)
                .set("user", user)
                .setNull("leftAt")
                .sample();

        when(_MeetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
        when(_UserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(_MeetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId)).thenReturn(Optional.of(meetingUser));

        // When
        Result<?> result = sut.leftMeeting(meetingId, userId);

        // Then
        assertSuccessVoidContract(result);

        var captor = ArgumentCaptor.forClass(MeetingUserEntity.class);
        verify(_MeetingUserRepository).save(captor.capture());
        var saved = captor.getValue();

        assertNotNull(saved.getLeftAt());
    }

    /* ----------------- Result Contract Assertions ----------------- */

    private static void assertSuccessVoidContract(Result<?> result) {
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertNotNull(result.getErrors());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty()); // ok()는 value=null -> Optional.empty
    }

    private static void assertFailureContract(Result<?> result) {
        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertTrue(result.isFailure());
        assertNotNull(result.getErrors());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());
    }

    private static void assertHasNotFoundError(Result<?> result, String resourceName, Object key) {
        assertTrue(
                result.getErrors().stream().anyMatch(err ->
                        err instanceof NotFoundError
                                && err.getCode() == 404
                                && err.getMetadata() != null
                                && Objects.equals(resourceName, err.getMetadata().get("resource"))
                                && Objects.equals(key, err.getMetadata().get("key"))
                ),
                () -> "NotFoundError(code=404, metadata.resource=" + resourceName + ", metadata.key=" + key + ") 가 포함되어야 합니다. errors=" + result.getErrors()
        );
    }

    private static void assertHasForbiddenError(Result<?> result, int code, String messageContains) {
        assertTrue(
                result.getErrors().stream().anyMatch(err ->
                        err instanceof ForbiddenError
                                && err.getCode() == code
                                && err.getMessage() != null
                                && err.getMessage().contains(messageContains)
                                && err.getMetadata() != null
                                && err.getMetadata().isEmpty()
                ),
                () -> "ForbiddenError(code=" + code + ", message contains '" + messageContains + "') 가 포함되어야 합니다. errors=" + result.getErrors()
        );
    }
}
