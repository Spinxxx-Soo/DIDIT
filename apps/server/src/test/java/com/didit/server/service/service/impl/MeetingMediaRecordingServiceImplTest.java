package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.MeetingRecordEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.external.openvidu.OpenViduClient;
import com.didit.server.data.repository.MeetingRecordRepository;
import com.didit.server.data.repository.MeetingRepository;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.service.command.UpdateRecordingCommand;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.ResultError;
import com.didit.server.share.result.impl.NotFoundError;
import com.didit.server.share.result.impl.ServerError;
import com.navercorp.fixturemonkey.FixtureMonkey;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("MeetingMediaRecordingServiceImpl 유닛 테스트")
@ExtendWith(MockitoExtension.class)
class MeetingMediaRecordingServiceImplTest {

    /*
     * [가정]
     * - OpenViduClient.startRecording(...)의 반환 타입은 Result<SomeType>이며, SomeType에는 getRecordingId()가 존재한다.
     * - OpenViduClient.findRecording(...)의 반환 타입은 Result<SomeType>이며, SomeType에는 getDownloadUrl()가 존재한다.
     * - (위 타입/메서드명은 SUT가 컴파일되는 실제 시그니처를 기준으로, 테스트에서는 리플렉션+Mockito Answer로 안전하게 스텁한다.)
     */

    private final FixtureMonkey fixture = FixtureMonkey.builder().defaultNotNull(true).build();

    @Mock
    private MeetingRepository meetingRepository;

    @Mock
    private MeetingRecordRepository meetingRecordRepository;

    @Mock
    private OpenViduClient openViduClient;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MeetingMediaRecordingServiceImpl sut;

    @Test
    void startRecording_validInput_returnsOk() {
        // Given
        long meetingId = 1L;
        long userId = 2L;
        String sessionId = "session-123";
        long savedMeetingRecordId = 99L;

        var meetingEntity = fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .set("sessionId", sessionId)
                .setNull("project")
                .setNull("createdBy")
                .sample();

        var userEntity = fixture.giveMeBuilder(UserEntity.class)
                .set("id", userId)
                .sample();

        Object recordingRef = mockOpenViduStartRecordingRef("recording-abc");

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meetingEntity));
        when(userRepository.findById(userId)).thenReturn(Optional.of(userEntity));
        when(openViduClient.startRecording(eq(sessionId), anyString()))
                .thenReturn((Result) Result.ok(recordingRef));

        when(meetingRecordRepository.saveAndFlush(any(MeetingRecordEntity.class)))
                .thenAnswer(invocation -> {
                    MeetingRecordEntity arg = invocation.getArgument(0, MeetingRecordEntity.class);
                    // save 후 id가 채워진다고 가정
                    arg.setId(savedMeetingRecordId);
                    return arg;
                });

        // When
        Result<Long> result = sut.StartRecording(meetingId, userId);

        // Then
        assertSuccessWithValue(result, savedMeetingRecordId);
        verify(openViduClient, times(1)).startRecording(eq(sessionId), anyString());
        verify(meetingRecordRepository, times(1)).saveAndFlush(any(MeetingRecordEntity.class));
    }

    @Test
    void startRecording_meetingNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 10L;
        long userId = 20L;

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.empty());

        // When
        Result<Long> result = sut.StartRecording(meetingId, userId);

        // Then
        assertFailure(result);
        assertHasNotFoundError(result.getErrors(), "meetingId", meetingId);

        verify(openViduClient, never()).startRecording(anyString(), anyString());
        verify(userRepository, never()).findById(anyLong());
        verify(meetingRecordRepository, never()).saveAndFlush(any(MeetingRecordEntity.class));
    }

    @Test
    void startRecording_openViduStartFails_returnsFailServerError() {
        // Given
        long meetingId = 1L;
        long userId = 2L;
        String sessionId = "session-err";

        var meetingEntity = fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .set("sessionId", sessionId)
                .setNull("project")
                .setNull("createdBy")
                .sample();

        var openViduError = new ServerError("sessionId", sessionId);

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meetingEntity));
        when(openViduClient.startRecording(eq(sessionId), anyString()))
                .thenReturn((Result) Result.fail(openViduError));

        // When
        Result<Long> result = sut.StartRecording(meetingId, userId);

        // Then
        assertFailure(result);
        assertHasServerError(result.getErrors(), "sessionId", sessionId);

        verify(userRepository, never()).findById(anyLong());
        verify(meetingRecordRepository, never()).saveAndFlush(any(MeetingRecordEntity.class));
    }

    @Test
    void startRecording_userNotFound_returnsFailNotFound() {
        // Given
        long meetingId = 1L;
        long userId = 404L;
        String sessionId = "session-123";

        var meetingEntity = fixture.giveMeBuilder(MeetingEntity.class)
                .set("id", meetingId)
                .set("sessionId", sessionId)
                .setNull("project")
                .setNull("createdBy")
                .sample();

        Object recordingRef = mockOpenViduStartRecordingRef("recording-xyz");

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meetingEntity));
        when(openViduClient.startRecording(eq(sessionId), anyString()))
                .thenReturn((Result) Result.ok(recordingRef));
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When
        Result<Long> result = sut.StartRecording(meetingId, userId);

        // Then
        assertFailure(result);
        assertHasNotFoundError(result.getErrors(), "userId", userId);

        verify(meetingRecordRepository, never()).saveAndFlush(any(MeetingRecordEntity.class));
    }

    @Test
    void stopRecording_meetingRecordNotFound_returnsFailNotFound() {
        // Given
        long meetingRecordId = 100L;
        when(meetingRecordRepository.findById(meetingRecordId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.StopRecording(meetingRecordId);

        // Then
        assertFailure(result);
        assertHasNotFoundError(result.getErrors(), "meetingRecordId", meetingRecordId);

        verify(openViduClient, never()).stopRecording(anyString());
    }

    @Test
    void stopRecording_openViduStopFails_returnsFailServerError() {
        // Given
        long meetingRecordId = 3L;
        String recordingSessionId = "recording-session-1";

        var recordEntity = fixture.giveMeBuilder(MeetingRecordEntity.class)
                .set("id", meetingRecordId)
                .set("recordingSessionId", recordingSessionId)
                .sample();

        when(meetingRecordRepository.findById(meetingRecordId)).thenReturn(Optional.of(recordEntity));
        when(openViduClient.stopRecording(recordingSessionId))
                .thenReturn((Result) Result.fail(new ServerError("recordingSessionId", recordingSessionId)));

        // When
        Result<?> result = sut.StopRecording(meetingRecordId);

        // Then
        assertFailure(result);
        assertHasServerError(result.getErrors(), "recordingSessionId", recordingSessionId);
        verify(openViduClient, times(1)).stopRecording(recordingSessionId);
    }

    @Test
    void stopRecording_validInput_returnsOk() {
        // Given
        long meetingRecordId = 3L;
        String recordingSessionId = "recording-session-1";

        var recordEntity = fixture.giveMeBuilder(MeetingRecordEntity.class)
                .set("id", meetingRecordId)
                .set("recordingSessionId", recordingSessionId)
                .sample();

        when(meetingRecordRepository.findById(meetingRecordId)).thenReturn(Optional.of(recordEntity));
        when(openViduClient.stopRecording(recordingSessionId)).thenReturn((Result) Result.ok());

        // When
        Result<?> result = sut.StopRecording(meetingRecordId);

        // Then
        assertSuccessWithoutValue(result);
        verify(openViduClient, times(1)).stopRecording(recordingSessionId);
    }

    @Test
    void updateRecording_meetingRecordNotFound_returnsFailNotFound() {
        // Given
        long meetingRecordId = 55L;
        var cmd = fixture.giveMeOne(UpdateRecordingCommand.class);

        when(meetingRecordRepository.findById(meetingRecordId)).thenReturn(Optional.empty());

        // When
        Result<?> result = sut.UpdateRecording(meetingRecordId, cmd);

        // Then
        assertFailure(result);
        assertHasNotFoundError(result.getErrors(), "meetingRecordId", meetingRecordId);
        verify(meetingRecordRepository, never()).saveAndFlush(any(MeetingRecordEntity.class));
    }

    @Test
    void updateRecording_validCommand_returnsOk() {
        // Given
        long meetingRecordId = 77L;

        LocalDateTime oldStart = LocalDateTime.of(2026, 2, 1, 10, 0);
        LocalDateTime oldEnd = LocalDateTime.of(2026, 2, 1, 11, 0);
        LocalDateTime newStart = LocalDateTime.of(2026, 2, 1, 10, 30);
        LocalDateTime newEnd = LocalDateTime.of(2026, 2, 1, 11, 30);

        var entity = fixture.giveMeBuilder(MeetingRecordEntity.class)
                .set("id", meetingRecordId)
                .set("startAt", oldStart)
                .set("endAt", oldEnd)
                .sample();

        var cmd = new UpdateRecordingCommand(newStart, newEnd);

        when(meetingRecordRepository.findById(meetingRecordId)).thenReturn(Optional.of(entity));
        when(meetingRecordRepository.saveAndFlush(any(MeetingRecordEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0, MeetingRecordEntity.class));

        // When
        Result<?> result = sut.UpdateRecording(meetingRecordId, cmd);

        // Then
        assertSuccessWithoutValue(result);
        verify(meetingRecordRepository, times(1)).saveAndFlush(any(MeetingRecordEntity.class));

        // 관찰 가능한 외부 효과(저장되는 엔티티 값) 기준으로 최소 검증
        assertEquals(newStart, entity.getStartAt());
        assertEquals(newEnd, entity.getEndAt());
    }

    @Test
    void findMeetingRecordBySessionId_found_returnsOk() {
        // Given
        String recordingSessionId = "rec-session-10";
        long meetingRecordId = 5L;

        var entity = fixture.giveMeBuilder(MeetingRecordEntity.class)
                .set("id", meetingRecordId)
                .set("recordingSessionId", recordingSessionId)
                .sample();

        when(meetingRecordRepository.findByRecordingSessionId(recordingSessionId)).thenReturn(Optional.of(entity));

        // When
        Result<MeetingRecordEntity> result = sut.findMeetingRecordBySessionId(recordingSessionId);

        // Then
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertNotNull(result.getErrors());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getValue().isPresent());
        assertEquals(meetingRecordId, result.getOrThrow().getId());
    }

    @Test
    void findMeetingRecordBySessionId_notFound_returnsFailNotFound() {
        // Given
        String recordingSessionId = "missing-session";
        when(meetingRecordRepository.findByRecordingSessionId(recordingSessionId)).thenReturn(Optional.empty());

        // When
        Result<MeetingRecordEntity> result = sut.findMeetingRecordBySessionId(recordingSessionId);

        // Then
        assertFailure(result);
        assertHasNotFoundError(result.getErrors(), "sessionId", recordingSessionId);
    }

    @Test
    void findDownloadURL_meetingRecordNotFound_returnsFailNotFound() {
        // Given
        long meetingRecordId = 404L;
        when(meetingRecordRepository.findById(meetingRecordId)).thenReturn(Optional.empty());

        // When
        Result<String> result = sut.findDownloadURL(meetingRecordId);

        // Then
        assertFailure(result);
        assertHasNotFoundError(result.getErrors(), "meetingRecordId", meetingRecordId);
        verify(openViduClient, never()).findRecording(anyString());
    }

    @Test
    void findDownloadURL_openViduFindFails_returnsFailServerError() {
        // Given
        long meetingRecordId = 9L;
        String recordingSessionId = "rec-session-9";

        var entity = fixture.giveMeBuilder(MeetingRecordEntity.class)
                .set("id", meetingRecordId)
                .set("recordingSessionId", recordingSessionId)
                .sample();

        when(meetingRecordRepository.findById(meetingRecordId)).thenReturn(Optional.of(entity));
        when(openViduClient.findRecording(recordingSessionId))
                .thenReturn((Result) Result.fail(new ServerError("recordingSessionId", recordingSessionId)));

        // When
        Result<String> result = sut.findDownloadURL(meetingRecordId);

        // Then
        assertFailure(result);
        assertHasServerError(result.getErrors(), "recordingSessionId", recordingSessionId);
    }

    @Test
    void findDownloadURL_validInput_returnsOk() {
        // Given
        long meetingRecordId = 9L;
        String recordingSessionId = "rec-session-9";
        String expectedUrl = "https://download.example.com/recording.mp4";

        var entity = fixture.giveMeBuilder(MeetingRecordEntity.class)
                .set("id", meetingRecordId)
                .set("recordingSessionId", recordingSessionId)
                .sample();

        Object recordingRef = mockOpenViduFindRecordingRef(expectedUrl);

        when(meetingRecordRepository.findById(meetingRecordId)).thenReturn(Optional.of(entity));
        when(openViduClient.findRecording(recordingSessionId))
                .thenReturn((Result) Result.ok(recordingRef));

        // When
        Result<String> result = sut.findDownloadURL(meetingRecordId);

        // Then
        assertSuccessWithValue(result, expectedUrl);
        verify(openViduClient, times(1)).findRecording(recordingSessionId);
    }

    /* -----------------------
     * Result Contract Helpers
     * ----------------------- */

    private static <T> void assertSuccessWithValue(Result<T> result, T expectedValue) {
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertNotNull(result.getErrors());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getValue().isPresent());
        assertEquals(expectedValue, result.getOrThrow());
    }

    private static void assertSuccessWithoutValue(Result<?> result) {
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertNotNull(result.getErrors());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());
    }

    private static void assertFailure(Result<?> result) {
        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertTrue(result.isFailure());
        assertNotNull(result.getErrors());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());
    }

    private static void assertHasNotFoundError(List<ResultError> errors, String resourceName, Object key) {
        assertNotNull(errors);
        assertTrue(errors.stream().anyMatch(NotFoundError.class::isInstance));
        assertTrue(errors.stream().anyMatch(e ->
                e.getCode() == 404
                        && Objects.equals(e.getMetadata().get("resource"), resourceName)
                        && Objects.equals(e.getMetadata().get("key"), key)
        ));
    }

    private static void assertHasServerError(List<ResultError> errors, String resourceName, Object key) {
        assertNotNull(errors);
        assertTrue(errors.stream().anyMatch(ServerError.class::isInstance));
        assertTrue(errors.stream().anyMatch(e ->
                e.getCode() == 500
                        && Objects.equals(e.getMetadata().get("resource"), resourceName)
                        && Objects.equals(e.getMetadata().get("key"), key)
        ));
    }

    /* -----------------------
     * OpenVidu Value Mocks (reflection-safe)
     * ----------------------- */

    private static Object mockOpenViduStartRecordingRef(String recordingId) {
        Class<?> valueType = extractResultValueType(OpenViduClient.class, "startRecording", String.class, String.class);
        return Mockito.mock(valueType, invocation -> {
            if ("getRecordingId".equals(invocation.getMethod().getName())) {
                return recordingId;
            }
            return Mockito.RETURNS_DEFAULTS.answer(invocation);
        });
    }

    private static Object mockOpenViduFindRecordingRef(String downloadUrl) {
        Class<?> valueType = extractResultValueType(OpenViduClient.class, "findRecording", String.class);
        return Mockito.mock(valueType, invocation -> {
            if ("getDownloadUrl".equals(invocation.getMethod().getName())) {
                return downloadUrl;
            }
            return Mockito.RETURNS_DEFAULTS.answer(invocation);
        });
    }

    private static Class<?> extractResultValueType(Class<?> owner, String methodName, Class<?>... paramTypes) {
        try {
            var method = owner.getMethod(methodName, paramTypes);
            Type generic = method.getGenericReturnType();

            if (!(generic instanceof ParameterizedType parameterizedType)) {
                throw new IllegalStateException("OpenViduClient." + methodName + " must return parameterized Result<T>");
            }

            Type[] args = parameterizedType.getActualTypeArguments();
            if (args.length != 1) {
                throw new IllegalStateException("Result<T> should have exactly 1 type argument");
            }

            return toClass(args[0]);
        } catch (NoSuchMethodException e) {
            throw new IllegalStateException("Method not found: " + owner.getName() + "." + methodName, e);
        }
    }

    private static Class<?> toClass(Type type) {
        if (type instanceof Class<?> clazz) {
            return clazz;
        }
        if (type instanceof ParameterizedType pt && pt.getRawType() instanceof Class<?> raw) {
            return raw;
        }
        // 와일드카드/타입변수 등 복잡 케이스는 Object로 폴백 (실제 프로젝트에서는 보통 concrete class)
        return Object.class;
    }
}
