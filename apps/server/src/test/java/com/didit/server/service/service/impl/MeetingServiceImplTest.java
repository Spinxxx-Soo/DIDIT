package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.ProjectEntity;
import com.didit.server.data.entity.ProjectUserEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.entity.enums.MeetingMode;
import com.didit.server.data.entity.enums.MeetingStatus;
import com.didit.server.data.entity.enums.ProjectUserRole;
import com.didit.server.data.repository.MeetingRepository;
import com.didit.server.data.repository.ProjectRepository;
import com.didit.server.data.repository.ProjectUserRepository;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.service.command.BookMeetingCommand;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.ResultError;
import com.didit.server.share.result.impl.ForbiddenError;
import com.didit.server.share.result.impl.NotFoundError;
import com.navercorp.fixturemonkey.FixtureMonkey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MeetingServiceImplTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MeetingRepository meetingRepository;

    @Mock
    private ProjectUserRepository projectUserRepository;

    @InjectMocks
    private MeetingServiceImpl sut;


    private FixtureMonkey fixtureMonkey;

    @BeforeEach
    void setUp() {
        fixtureMonkey = FixtureMonkey.builder()
                .defaultNotNull(true)
                .build();
    }

    @Test
    @DisplayName("정상(프로젝트/유저 존재 + ADMIN)이면 ok(meetingId)를 반환하고 MeetingEntity를 RUNNING으로 저장한다")
    void createMeeting_success_admin_returnsOkId_andSavesRunningMeeting() {
        // Given
        long projectId = 10L;
        long userId = 7L;
        String title = "Daily Sync";
        MeetingMode mode = MeetingMode.CHAT;

        ProjectEntity project = mock(ProjectEntity.class);
        when(project.getId()).thenReturn(projectId);

        UserEntity user = mock(UserEntity.class);
        when(user.getId()).thenReturn(userId);

        ProjectUserEntity projectUser = mock(ProjectUserEntity.class);
        when(projectUser.getRole()).thenReturn(ProjectUserRole.ADMIN);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(projectUserRepository.findByProject_IdAndUser_Id(projectId, userId))
                .thenReturn(Optional.of(projectUser));

        when(meetingRepository.save(any(MeetingEntity.class))).thenAnswer(inv -> {
            MeetingEntity e = inv.getArgument(0);
            e.setId(123L);
            return e;
        });

        // When
        Result<Long> result = sut.createMeeting(projectId, userId, title, mode);

        // Then (Result 계약)
        assertTrue(result.isSuccess());
        assertTrue(result.getErrors().isEmpty());
        assertEquals(123L, result.getValue().orElseThrow());

        // Then (저장 엔티티 검증)
        ArgumentCaptor<MeetingEntity> captor = ArgumentCaptor.forClass(MeetingEntity.class);
        verify(meetingRepository).save(captor.capture());
        MeetingEntity saved = captor.getValue();

        assertSame(project, saved.getProject());
        assertSame(user, saved.getCreatedBy());
        assertEquals(title, saved.getTitle());
        assertEquals(MeetingStatus.RUNNING, saved.getStatus());
        assertEquals(mode, saved.getMode());
        assertNotNull(saved.getSessionId());
        assertDoesNotThrow(() -> UUID.fromString(saved.getSessionId())); // UUID 형식

        // Then (호출 검증)
        verify(projectRepository).findById(projectId);
        verify(userRepository).findById(userId);
        verify(projectUserRepository).findByProject_IdAndUser_Id(projectId, userId);
        verifyNoMoreInteractions(projectRepository, userRepository, projectUserRepository, meetingRepository);
    }

    @Test
    @DisplayName("projectId가 없으면 fail(404 NotFoundError(resource=projectId))")
    void createMeeting_projectNotFound_returns404() {
        // Given
        long projectId = 999L;
        long userId = 7L;

        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        // When
        Result<Long> result = sut.createMeeting(projectId, userId, "t", MeetingMode.VOICE);

        // Then
        assertTrue(result.isFailure());
        assertTrue(result.getValue().isEmpty());

        ResultError error = result.getSingleErrorOrThrow();
        assertEquals(404, error.getCode());
        assertInstanceOf(NotFoundError.class, error);
        assertEquals("projectId", error.getMetadata().get("resource"));
        assertEquals(projectId, error.getMetadata().get("key"));

        verify(projectRepository).findById(projectId);
        verifyNoInteractions(userRepository, projectUserRepository, meetingRepository);
        verifyNoMoreInteractions(projectRepository);
    }

    @Test
    @DisplayName("userId가 없으면 fail(404 NotFoundError(resource=userId))")
    void createMeeting_userNotFound_returns404() {
        // Given
        long projectId = 10L;
        long userId = 999L;

        ProjectEntity project = mock(ProjectEntity.class);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When
        Result<Long> result = sut.createMeeting(projectId, userId, "t", MeetingMode.VOICE);

        // Then
        assertTrue(result.isFailure());
        assertTrue(result.getValue().isEmpty());

        ResultError error = result.getSingleErrorOrThrow();
        assertEquals(404, error.getCode());
        assertInstanceOf(NotFoundError.class, error);
        assertEquals("userId", error.getMetadata().get("resource"));
        assertEquals(userId, error.getMetadata().get("key"));

        verify(projectRepository).findById(projectId);
        verify(userRepository).findById(userId);
        verifyNoInteractions(projectUserRepository, meetingRepository);
        verifyNoMoreInteractions(projectRepository, userRepository);
    }

    @Test
    @DisplayName("프로젝트 유저가 없거나 ADMIN이 아니면 fail(403 ForbiddenError)")
    void createMeeting_notAdmin_returns403() {
        // Given
        long projectId = 10L;
        long userId = 7L;

        ProjectEntity project = mock(ProjectEntity.class);
        when(project.getId()).thenReturn(projectId);

        UserEntity user = mock(UserEntity.class);
        when(user.getId()).thenReturn(userId);

        ProjectUserEntity projectUser = mock(ProjectUserEntity.class);
        when(projectUser.getRole()).thenReturn(ProjectUserRole.MEMBER);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(projectUserRepository.findByProject_IdAndUser_Id(projectId, userId))
                .thenReturn(Optional.of(projectUser));

        // When
        Result<Long> result = sut.createMeeting(projectId, userId, "t", MeetingMode.CHAT);

        // Then
        assertTrue(result.isFailure());
        assertTrue(result.getValue().isEmpty());

        ResultError error = result.getSingleErrorOrThrow();
        assertEquals(403, error.getCode());
        assertInstanceOf(ForbiddenError.class, error);

        verify(projectRepository).findById(projectId);
        verify(userRepository).findById(userId);
        verify(projectUserRepository).findByProject_IdAndUser_Id(projectId, userId);
        verifyNoInteractions(meetingRepository);
        verifyNoMoreInteractions(projectRepository, userRepository, projectUserRepository);
    }


    @Test
    @DisplayName("정상(프로젝트/유저 존재 + ADMIN)이면 ok(meetingId)를 반환하고 MeetingEntity를 SCHEDULED로 저장한다")
    void bookMeeting_success_admin_returnsOkId_andSavesScheduledMeeting() {
        // Given
        long projectId = 10L;
        long userId = 7L;
        String title = "예약 회의";
        LocalDateTime start = LocalDateTime.of(2026, 2, 1, 10, 0);
        LocalDateTime end = LocalDateTime.of(2026, 2, 1, 11, 0);

        BookMeetingCommand cmd = new BookMeetingCommand(projectId, userId, title, start, end);

        ProjectEntity project = mock(ProjectEntity.class);
        when(project.getId()).thenReturn(projectId);

        UserEntity user = mock(UserEntity.class);
        when(user.getId()).thenReturn(userId);

        ProjectUserEntity projectUser = mock(ProjectUserEntity.class);
        when(projectUser.getRole()).thenReturn(ProjectUserRole.ADMIN);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(projectUserRepository.findByProject_IdAndUser_Id(projectId, userId))
                .thenReturn(Optional.of(projectUser));

        when(meetingRepository.save(any(MeetingEntity.class))).thenAnswer(inv -> {
            MeetingEntity e = inv.getArgument(0);
            e.setId(456L);
            return e;
        });

        // When
        Result<Long> result = sut.bookMeeting(cmd);

        // Then (Result 계약)
        assertTrue(result.isSuccess());
        assertTrue(result.getErrors().isEmpty());
        assertEquals(456L, result.getValue().orElseThrow());

        // Then (저장 엔티티 검증)
        ArgumentCaptor<MeetingEntity> captor = ArgumentCaptor.forClass(MeetingEntity.class);
        verify(meetingRepository).save(captor.capture());
        MeetingEntity saved = captor.getValue();

        assertSame(project, saved.getProject());
        assertSame(user, saved.getCreatedBy());
        assertEquals(title, saved.getTitle());
        assertEquals(MeetingStatus.SCHEDULED, saved.getStatus());
        assertEquals(MeetingMode.VOICE, saved.getMode()); // 구현에서 VOICE 고정
        assertEquals(start, saved.getStartedAt());
        assertEquals(end, saved.getEndedAt());
        assertNotNull(saved.getSessionId());
        assertDoesNotThrow(() -> UUID.fromString(saved.getSessionId()));

        verify(projectRepository).findById(projectId);
        verify(userRepository).findById(userId);
        verify(projectUserRepository).findByProject_IdAndUser_Id(projectId, userId);
        verifyNoMoreInteractions(projectRepository, userRepository, projectUserRepository, meetingRepository);
    }

    @Test
    @DisplayName("projectId가 없으면 fail(404 NotFoundError(resource=projectId))")
    void bookMeeting_projectNotFound_returns404() {
        // Given
        long projectId = 999L;
        BookMeetingCommand cmd = new BookMeetingCommand(projectId, 7L, "t",
                LocalDateTime.of(2026, 2, 1, 10, 0),
                LocalDateTime.of(2026, 2, 1, 11, 0));

        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        // When
        Result<Long> result = sut.bookMeeting(cmd);

        // Then
        assertTrue(result.isFailure());
        assertTrue(result.getValue().isEmpty());

        ResultError error = result.getSingleErrorOrThrow();
        assertEquals(404, error.getCode());
        assertInstanceOf(NotFoundError.class, error);
        assertEquals("projectId", error.getMetadata().get("resource"));
        assertEquals(projectId, error.getMetadata().get("key"));

        verify(projectRepository).findById(projectId);
        verifyNoInteractions(userRepository, projectUserRepository, meetingRepository);
        verifyNoMoreInteractions(projectRepository);
    }

    @Test
    @DisplayName("userId가 없으면 fail(404 NotFoundError(resource=userId))")
    void bookMeeting_userNotFound_returns404() {
        // Given
        long projectId = 10L;
        long userId = 999L;
        BookMeetingCommand cmd = new BookMeetingCommand(projectId, userId, "t",
                LocalDateTime.of(2026, 2, 1, 10, 0),
                LocalDateTime.of(2026, 2, 1, 11, 0));

        ProjectEntity project = mock(ProjectEntity.class);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When
        Result<Long> result = sut.bookMeeting(cmd);

        // Then
        assertTrue(result.isFailure());
        assertTrue(result.getValue().isEmpty());

        ResultError error = result.getSingleErrorOrThrow();
        assertEquals(404, error.getCode());
        assertInstanceOf(NotFoundError.class, error);
        assertEquals("userId", error.getMetadata().get("resource"));
        assertEquals(userId, error.getMetadata().get("key"));

        verify(projectRepository).findById(projectId);
        verify(userRepository).findById(userId);
        verifyNoInteractions(projectUserRepository, meetingRepository);
        verifyNoMoreInteractions(projectRepository, userRepository);
    }

    @Test
    @DisplayName("프로젝트 유저가 없거나 ADMIN이 아니면 fail(403 ForbiddenError)")
    void bookMeeting_notAdmin_returns403() {
        // Given
        long projectId = 10L;
        long userId = 7L;
        BookMeetingCommand cmd = new BookMeetingCommand(projectId, userId, "t",
                LocalDateTime.of(2026, 2, 1, 10, 0),
                LocalDateTime.of(2026, 2, 1, 11, 0));

        ProjectEntity project = mock(ProjectEntity.class);
        when(project.getId()).thenReturn(projectId);

        UserEntity user = mock(UserEntity.class);
        when(user.getId()).thenReturn(userId);

        ProjectUserEntity projectUser = mock(ProjectUserEntity.class);
        when(projectUser.getRole()).thenReturn(ProjectUserRole.MEMBER);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(projectUserRepository.findByProject_IdAndUser_Id(projectId, userId))
                .thenReturn(Optional.of(projectUser));

        // When
        Result<Long> result = sut.bookMeeting(cmd);

        // Then
        assertTrue(result.isFailure());
        assertTrue(result.getValue().isEmpty());

        ResultError error = result.getSingleErrorOrThrow();
        assertEquals(403, error.getCode());
        assertInstanceOf(ForbiddenError.class, error);

        verify(projectRepository).findById(projectId);
        verify(userRepository).findById(userId);
        verify(projectUserRepository).findByProject_IdAndUser_Id(projectId, userId);
        verifyNoInteractions(meetingRepository);
        verifyNoMoreInteractions(projectRepository, userRepository, projectUserRepository);
    }


    // =========================
    // UpdateMeeting
    // =========================

    @Nested
    @DisplayName("UpdateMeetingTitle")
    class UpdateMeetingTests {

        @Test
        @DisplayName("존재하는 meetingId면 제목/시작/종료를 변경하고 ok()를 반환한다")
        void UpdateMeeting_existingMeetingId_updatesAndReturnsOk() {
            // Given
            long meetingId = 1L;
            String newTitle = "New Title";
            LocalDateTime newStart = LocalDateTime.of(2026, 1, 23, 10, 0);
            LocalDateTime newDue = LocalDateTime.of(2026, 1, 23, 11, 0);

            MeetingEntity meeting = fixtureMonkey.giveMeOne(MeetingEntity.class);

            when(meetingRepository.findById(meetingId))
                    .thenReturn(Optional.of(meeting));

            // save를 부르는 구현이면 아래 스텁이 없어도 되지만, 안전하게 둠
            when(meetingRepository.save(any(MeetingEntity.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // When
            Result<?> result = sut.UpdateMeeting(meetingId, newTitle, newStart, newDue);

            // Then (Result 계약)
            assertTrue(result.isSuccess());
            assertFalse(result.isFailure());
            assertTrue(result.getErrors().isEmpty());
            // ok() (Void)라면 value는 null -> Optional.empty
            assertTrue(result.getValue().isEmpty());

            // Then (Persistence: 변경)
            verify(meetingRepository, times(1)).findById(meetingId);

            // 저장 호출을 하는 구현이라면: 변경 값이 반영된 엔티티가 save로 넘어가는지 검증
            ArgumentCaptor<MeetingEntity> captor = ArgumentCaptor.forClass(MeetingEntity.class);
            verify(meetingRepository, times(1)).save(captor.capture());

            MeetingEntity saved = captor.getValue();
            assertSame(meeting, saved);

            // TODO: 엔티티 필드/게터 이름에 맞게 수정 (예: getTitle/getStartedAt/getDueAt)
            assertEquals(newTitle, saved.getTitle());
            assertEquals(newStart, saved.getStartedAt());
            assertEquals(newDue, saved.getEndedAt());

            verifyNoMoreInteractions(meetingRepository);
        }

        @Test
        @DisplayName("존재하지 않는 meetingId면 fail(NotFoundError(resource=meetingId))를 반환한다")
        void UpdateMeeting_notExistingMeetingId_returnsFailNotFound() {
            // Given
            long meetingId = 999L;
            String newTitle = "New Title";
            LocalDateTime newStart = LocalDateTime.of(2026, 1, 23, 10, 0);
            LocalDateTime newDue = LocalDateTime.of(2026, 1, 23, 11, 0);

            when(meetingRepository.findById(meetingId))
                    .thenReturn(Optional.empty());

            // When
            Result<?> result = sut.UpdateMeeting(meetingId, newTitle, newStart, newDue);

            // Then (Result 계약)
            assertTrue(result.isFailure());
            assertFalse(result.isSuccess());
            assertTrue(result.getValue().isEmpty());
            assertNotNull(result.getErrors());
            assertFalse(result.getErrors().isEmpty());

            // Then (에러 고정)
            ResultError error = result.getErrors().get(0);
            assertEquals(404, error.getCode());
            assertInstanceOf(NotFoundError.class, error);
            assertEquals("meetingId", error.getMetadata().get("resource"));
            assertEquals(meetingId, error.getMetadata().get("key"));

            // Then (Persistence: 변경 안됨)
            verify(meetingRepository, times(1)).findById(meetingId);
            verify(meetingRepository, never()).save(any());
            verifyNoMoreInteractions(meetingRepository);
        }
    }

    // =========================
    // DeleteMeeting(meetingId)
    // =========================

    @Test
    @DisplayName("회의실이 존재하면 삭제하고 ok()를 반환한다")
    void DeleteMeeting_meetingExists_deletes_returnsOk() {
        // Given
        long meetingId = 100L;
        MeetingEntity meeting = aMeeting(meetingId, "t");

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));

        // When
        Result result = sut.DeleteMeeting(meetingId);

        // Then
        assertTrue(result.isSuccess(), () -> "errors=" + result.getErrors());
        assertTrue(result.getErrors().isEmpty());

        // ✅ 구현 스타일에 맞춰 하나만 남겨
        // 1) delete(entity) 호출 구현
        verify(meetingRepository, times(1)).delete(meeting);

        // 2) deleteById(meetingId) 호출 구현이면 위 대신:
        // verify(meetingRepository, times(1)).deleteById(meetingId);
    }

    @Test
    @DisplayName("회의실이 존재하지 않으면 fail(404 NotFoundError: resource=meetingId, key=meetingId)를 반환한다")
    void DeleteMeeting_notFound_returns404NotFound() {
        // Given
        long meetingId = 9999L;

        when(meetingRepository.findById(meetingId)).thenReturn(Optional.empty());

        // When
        Result result = sut.DeleteMeeting(meetingId);

        // Then
        assertNotFound(result, "meetingId", meetingId);

        verify(meetingRepository, never()).delete(any());
        // deleteById 구현이면:
        // verify(meetingRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("유효한 projectId와 커서가 주어지면 회의 리스트 반환에 성공한다.")
    void GetMeetingList_Success() {
        // Given
        long projectId = 1L;
        MeetingStatus status = MeetingStatus.SCHEDULED;
        long cursor = 0L;
        Pageable pageable = PageRequest.of(0, 20);

        ProjectEntity project = ProjectEntity.builder().id(projectId).build();
        MeetingEntity meeting = MeetingEntity.builder()
                .id(10L)
                .title("테스트 회의")
                .status(status)
                .build();

        Slice<MeetingEntity> slice = new SliceImpl<>(List.of(meeting), pageable, false);

        given(projectRepository.findById(projectId)).willReturn(Optional.of(project));
        given(meetingRepository.findAllByCursor(eq(projectId), eq(status), eq(cursor), any(Pageable.class)))
                .willReturn(slice);

        // When
        Result<List<MeetingEntity>> result = sut.GetMeetingList(projectId, status, cursor, pageable);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getValue().get()).hasSize(1);
        assertThat(result.getValue().get().get(0).getId()).isEqualTo(10L);

        verify(projectRepository).findById(projectId);
        verify(meetingRepository).findAllByCursor(anyLong(), any(), anyLong(), any());
    }

    @Test
    @DisplayName("존재하지 않는 projectId로 조회하면 NotFoundError(404)를 반환한다.")
    void GetMeetingList_Fail_NotFoundProject() {
        // Given
        long invalidProjectId = 999L;
        given(projectRepository.findById(invalidProjectId)).willReturn(Optional.empty());

        // When
        Result<List<MeetingEntity>> result = sut.GetMeetingList(invalidProjectId, MeetingStatus.SCHEDULED, 0L, PageRequest.of(0, 20));

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow().getStatus().value()).isEqualTo(404);
        assertThat(result.getSingleErrorOrThrow().getMessage()).contains("projectId");
    }

    @Test
    @DisplayName("서버 내부 에러가 발생하면 ServerError(500)를 반환한다.")
    void GetMeetingList_Fail_InternalServerError() {
        // Given
        long projectId = 1L;
        given(projectRepository.findById(projectId)).willReturn(Optional.of(ProjectEntity.builder().id(projectId).build()));
        given(meetingRepository.findAllByCursor(anyLong(), any(), anyLong(), any()))
                .willThrow(new RuntimeException("DB Error"));

        // When
        Result<List<MeetingEntity>> result = sut.GetMeetingList(projectId, MeetingStatus.SCHEDULED, 0L, PageRequest.of(0, 20));

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow().getStatus().value()).isEqualTo(500);
        assertThat(result.getSingleErrorOrThrow().getMessage()).contains("MeetingList");
    }

    // =========================
    // FindMeetingById
    // =========================


    @Test
    @DisplayName("존재하는 meetingId면 ok(MeetingEntity)를 반환한다")
    void FindMeetingById_existingMeetingId_returnsOk() {
        // Given
        long meetingId = 1L;
        MeetingEntity meeting = fixtureMonkey.giveMeOne(MeetingEntity.class);

        when(meetingRepository.findById(meetingId))
                .thenReturn(Optional.of(meeting));

        // When
        Result<MeetingEntity> result = sut.FindMeetingById(meetingId);

        // Then (Result 계약)
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getValue().isPresent());

        // Then (값 검증)
        assertSame(meeting, result.getValue().orElseThrow());

        // Then (상호작용)
        verify(meetingRepository, times(1)).findById(meetingId);
        verifyNoMoreInteractions(meetingRepository);
    }

    @Test
    @DisplayName("존재하지 않는 meetingId면 fail(NotFoundError)를 반환한다")
    void FindMeetingById_notExistingMeetingId_returnsFailNotFound() {
        // Given
        long meetingId = 999L;

        when(meetingRepository.findById(meetingId))
                .thenReturn(Optional.empty());

        // When
        Result<MeetingEntity> result = sut.FindMeetingById(meetingId);

        // Then (Result 계약)
        assertTrue(result.isFailure());
        assertFalse(result.isSuccess());
        assertNotNull(result.getErrors());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());

        // Then (에러 고정: code/status + metadata/type 중 2개 이상)
        ResultError error = result.getErrors().get(0);
        assertEquals(404, error.getCode());
        assertInstanceOf(NotFoundError.class, error);
        assertEquals("meetingId", error.getMetadata().get("resource"));
        assertEquals(meetingId, error.getMetadata().get("key"));

        // Then (상호작용: 조회만 일어나야 함)
        verify(meetingRepository, times(1)).findById(meetingId);
        verifyNoMoreInteractions(meetingRepository);
    }

    @Test
    @DisplayName("projectId가 존재하면 ok(List<MeetingEntity>)를 반환한다")
    void GetMeetingListByDate_projectExists_returnsOkList() {
        // Given
        long projectId = 10L;
        LocalDateTime start = LocalDateTime.of(2026, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 1, 31, 23, 59);

        ProjectEntity project = new ProjectEntity();
        project.setId(projectId);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        MeetingEntity m1 = new MeetingEntity(); m1.setId(3L);
        MeetingEntity m2 = new MeetingEntity(); m2.setId(2L);
        MeetingEntity m3 = new MeetingEntity(); m3.setId(1L);
        List<MeetingEntity> found = List.of(m1, m2, m3);

        // TODO: 실제 레포 메서드명/기간 조건(포함/미포함), 컬럼명(startedAt/endedAt)에 맞게 변경
        // 예) findAllByProjectAndStartedAtBetween(project, start, end)
        when(meetingRepository.findByProjectIdAndStartedAtBetweenOrderByIdDesc(project.getId(), start, end))
                .thenReturn(found);

        // When
        Result<List<MeetingEntity>> result = sut.GetMeetingListByDate(projectId, start, end);

        // Then (Result 계약)
        assertTrue(result.isSuccess());
        assertFalse(result.isFailure());
        assertTrue(result.getErrors().isEmpty());
        assertTrue(result.getValue().isPresent());

        // Then (값 검증)
        List<MeetingEntity> value = result.getValue().orElseThrow();
        assertEquals(3, value.size());
        assertEquals(List.of(3L, 2L, 1L), value.stream().map(MeetingEntity::getId).toList());

        // Then (상호작용)
        verify(projectRepository, times(1)).findById(projectId);
        verify(meetingRepository, times(1)).findByProjectIdAndStartedAtBetweenOrderByIdDesc(project.getId(), start, end);
        verifyNoMoreInteractions(projectRepository, meetingRepository);
    }

    @Test
    @DisplayName("projectId가 존재하지 않으면 fail(NotFoundError(resource=projectId))를 반환하고 조회하지 않는다")
    void GetMeetingListByDate_projectNotExists_returnsFailNotFound() {
        // Given
        long projectId = 999L;
        LocalDateTime start = LocalDateTime.of(2026, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 1, 31, 23, 59);

        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        // When
        Result<List<MeetingEntity>> result = sut.GetMeetingListByDate(projectId, start, end);

        // Then (Result 계약)
        assertTrue(result.isFailure());
        assertFalse(result.isSuccess());
        assertTrue(result.getValue().isEmpty());
        assertFalse(result.getErrors().isEmpty());

        // Then (에러 고정)
        ResultError error = result.getSingleErrorOrThrow();
        assertEquals(404, error.getCode());
        assertInstanceOf(NotFoundError.class, error);
        assertEquals("projectId", error.getMetadata().get("resource"));
        assertEquals(projectId, error.getMetadata().get("key"));

        // Then (조회 없음)
        verify(projectRepository, times(1)).findById(projectId);
        verifyNoInteractions(meetingRepository);
        verifyNoMoreInteractions(projectRepository);
    }

    // =========================
    // Helpers
    // =========================

    private static void assertNotFound(Result<?> result, String resource, Object key) {
        assertTrue(result.isFailure(), () -> "value=" + result.getValue() + ", errors=" + result.getErrors());
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getValue().isEmpty());

        ResultError err = result.getErrors().get(0);
        assertEquals(404, err.getCode());
        assertNotNull(err.getMessage());

        Map<String, Object> meta = err.getMetadata();
        assertNotNull(meta);
        assertEquals(resource, String.valueOf(meta.get("resource")));
        assertEquals(String.valueOf(key), String.valueOf(meta.get("key")));
    }

    private static MeetingEntity aMeeting(long meetingId, String title) {
        // ⚠️ 네 MeetingEntity 필드/세터가 다르면 여기만 맞춰줘.
        MeetingEntity m = new MeetingEntity();
        m.setId(meetingId);
        m.setTitle(title);
        return m;
    }
}