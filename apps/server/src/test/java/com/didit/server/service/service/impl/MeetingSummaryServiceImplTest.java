package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.MeetingSummaryEntity;
import com.didit.server.data.entity.ProjectEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.repository.MeetingRepository;
import com.didit.server.data.repository.MeetingSummaryRepository;
import com.didit.server.data.repository.ProjectRepository;
import com.didit.server.data.repository.ProjectUserRepository;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.service.command.UpdateSummaryCommand;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.ResultError;
import com.didit.server.share.result.impl.ForbiddenError;
import com.didit.server.share.result.impl.NotFoundError;
import com.navercorp.fixturemonkey.FixtureMonkey;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MeetingSummaryServiceImpl 유닛 테스트")
class MeetingSummaryServiceImplTest {

        private final FixtureMonkey fixture = FixtureMonkey.builder().defaultNotNull(true).build();

        @Mock
        private MeetingSummaryRepository meetingSummaryRepository;
        @Mock
        private ProjectRepository projectRepository;
        @Mock
        private MeetingRepository meetingRepository;
        @Mock
        private UserRepository userRepository;
        @Mock
        private ProjectUserRepository projectUserRepository;

        @InjectMocks
        private MeetingSummaryServiceImpl sut;

        // ---------- FindById ----------

        @Test
        void findById_existingSummary_returnsOk() {
                // Given
                long summaryId = 1L;
                var project = fixture.giveMeBuilder(ProjectEntity.class)
                                .set("id", 100L)
                                .sample();
                var summary = fixture.giveMeBuilder(MeetingSummaryEntity.class)
                                .set("id", summaryId)
                                .set("project", project)
                                .set("title", "t")
                                .set("summaryMd", "md")
                                .sample();

                when(meetingSummaryRepository.findById(summaryId)).thenReturn(Optional.of(summary));

                // When
                Result<MeetingSummaryEntity> result = sut.FindById(summaryId);

                // Then
                assertSuccess(result);
                assertTrue(result.getValue().isPresent());
                assertEquals(summaryId, result.getValue().get().getId());
                verify(meetingSummaryRepository, times(1)).findById(summaryId);
        }

        @Test
        void findById_summaryNotFound_returnsFailNotFound() {
                // Given
                long summaryId = 999L;
                when(meetingSummaryRepository.findById(summaryId)).thenReturn(Optional.empty());

                // When
                Result<MeetingSummaryEntity> result = sut.FindById(summaryId);

                // Then
                assertFailNotFound(result, "summaryId", summaryId);
                verify(meetingSummaryRepository, times(1)).findById(summaryId);
        }

        // ---------- FindAllByProject ----------

        @Test
        void findAllByProject_projectExists_returnsOk() {
                // Given
                long projectId = 10L;

                var project = fixture.giveMeBuilder(ProjectEntity.class)
                                .set("id", projectId)
                                .sample();

                var summaries = List.of(
                                fixture.giveMeBuilder(MeetingSummaryEntity.class)
                                                .set("id", 1L)
                                                .set("project", project)
                                                .set("title", "t1")
                                                .set("summaryMd", "md1")
                                                .sample(),
                                fixture.giveMeBuilder(MeetingSummaryEntity.class)
                                                .set("id", 2L)
                                                .set("project", project)
                                                .set("title", "t2")
                                                .set("summaryMd", "md2")
                                                .sample());

                when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
                when(meetingSummaryRepository.findByProject_IdOrderByCreatedAtDesc(projectId)).thenReturn(summaries);

                // When
                Result<List<MeetingSummaryEntity>> result = sut.FindAllByProject(projectId);

                // Then
                assertSuccess(result);
                assertTrue(result.getValue().isPresent());
                assertEquals(2, result.getValue().get().size());
                verify(projectRepository, times(1)).findById(projectId);
                verify(meetingSummaryRepository, times(1)).findByProject_IdOrderByCreatedAtDesc(projectId);
        }

        @Test
        void findAllByProject_projectNotFound_returnsFailNotFound() {
                // Given
                long projectId = 10L;
                when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

                // When
                Result<List<MeetingSummaryEntity>> result = sut.FindAllByProject(projectId);

                // Then
                assertFailNotFound(result, "projectId", projectId);
                verify(projectRepository, times(1)).findById(projectId);
                verify(meetingSummaryRepository, never()).findByProject_IdOrderByCreatedAtDesc(anyLong());
        }

        // ---------- CreateSummary ----------

        @Test
        void createSummary_valid_returnsOk() {
                // Given
                long projectId = 10L;
                long meetingId = 20L;

                var project = fixture.giveMeBuilder(ProjectEntity.class)
                                .set("id", projectId)
                                .sample();
                var meeting = fixture.giveMeBuilder(MeetingEntity.class)
                                .set("id", meetingId)
                                .set("title", "meeting-title")
                                .sample();

                var saved = fixture.giveMeBuilder(MeetingSummaryEntity.class)
                                .set("id", 123L)
                                .set("project", project)
                                .set("title", "any")
                                .set("summaryMd", "md")
                                .sample();

                when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
                when(meetingRepository.findById(meetingId)).thenReturn(Optional.of(meeting));
                when(meetingSummaryRepository.saveAndFlush(any(MeetingSummaryEntity.class))).thenReturn(saved);

                // When
                Result<Long> result = sut.CreateSummary(projectId, meetingId);

                // Then
                assertSuccess(result);
                assertTrue(result.getValue().isPresent());
                assertEquals(123L, result.getValue().get());
                verify(meetingSummaryRepository, times(1)).saveAndFlush(any(MeetingSummaryEntity.class));
        }

        @Test
        void createSummary_projectNotFound_returnsFailNotFound() {
                // Given
                long projectId = 10L;
                long meetingId = 20L;

                when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

                // When
                Result<Long> result = sut.CreateSummary(projectId, meetingId);

                // Then
                assertFailNotFound(result, "projectId", projectId);
                verify(projectRepository, times(1)).findById(projectId);
                verify(meetingRepository, never()).findById(anyLong());
                verify(meetingSummaryRepository, never()).saveAndFlush(any(MeetingSummaryEntity.class));
        }

        @Test
        void createSummary_meetingNotFound_returnsFailNotFound() {
                // Given
                long projectId = 10L;
                long meetingId = 20L;

                var project = fixture.giveMeBuilder(ProjectEntity.class)
                                .set("id", projectId)
                                .sample();

                when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
                when(meetingRepository.findById(meetingId)).thenReturn(Optional.empty());

                // When
                Result<Long> result = sut.CreateSummary(projectId, meetingId);

                // Then
                assertFailNotFound(result, "meetingId", meetingId);
                verify(meetingSummaryRepository, never()).saveAndFlush(any(MeetingSummaryEntity.class));
        }

        // ---------- UpdateSummary ----------

        @Test
        void updateSummary_validMember_returnsOk() {
                // Given
                long summaryId = 1L;
                long userId = 2L;
                long projectId = 100L;

                var project = fixture.giveMeBuilder(ProjectEntity.class)
                                .set("id", projectId)
                                .sample();
                var summary = fixture.giveMeBuilder(MeetingSummaryEntity.class)
                                .set("id", summaryId)
                                .set("project", project)
                                .set("title", "old-title")
                                .set("summaryMd", "old-md")
                                .sample();
                var user = fixture.giveMeBuilder(UserEntity.class)
                                .set("id", userId)
                                .sample();

                var cmd = new UpdateSummaryCommand("new-title", "new-md");

                when(meetingSummaryRepository.findById(summaryId)).thenReturn(Optional.of(summary));
                when(userRepository.findById(userId)).thenReturn(Optional.of(user));
                when(projectUserRepository.existsByProject_IdAndUser_Id(projectId, userId)).thenReturn(true);

                // When
                Result<?> result = sut.UpdateSummary(summaryId, userId, cmd);

                // Then
                assertSuccess(result);
                verify(meetingSummaryRepository, times(1)).saveAndFlush(any(MeetingSummaryEntity.class));
        }

        @Test
        void updateSummary_summaryNotFound_returnsFailNotFound() {
                // Given
                long summaryId = 1L;
                long userId = 2L;

                when(meetingSummaryRepository.findById(summaryId)).thenReturn(Optional.empty());

                // When
                Result<?> result = sut.UpdateSummary(summaryId, userId, new UpdateSummaryCommand("t", "md"));

                // Then
                assertFailNotFound(result, "summaryId", summaryId);
                verify(userRepository, never()).findById(anyLong());
                verify(projectUserRepository, never()).existsByProject_IdAndUser_Id(anyLong(), anyLong());
                verify(meetingSummaryRepository, never()).saveAndFlush(any(MeetingSummaryEntity.class));
        }

        @Test
        void updateSummary_userNotFound_returnsFailNotFound() {
                // Given
                long summaryId = 1L;
                long userId = 2L;
                long projectId = 100L;

                var project = fixture.giveMeBuilder(ProjectEntity.class)
                                .set("id", projectId)
                                .sample();
                var summary = fixture.giveMeBuilder(MeetingSummaryEntity.class)
                                .set("id", summaryId)
                                .set("project", project)
                                .set("title", "old-title")
                                .set("summaryMd", "old-md")
                                .sample();

                when(meetingSummaryRepository.findById(summaryId)).thenReturn(Optional.of(summary));
                when(userRepository.findById(userId)).thenReturn(Optional.empty());

                // When
                Result<?> result = sut.UpdateSummary(summaryId, userId, new UpdateSummaryCommand("t", "md"));

                // Then
                assertFailNotFound(result, "userId", userId);
                verify(projectUserRepository, never()).existsByProject_IdAndUser_Id(anyLong(), anyLong());
                verify(meetingSummaryRepository, never()).saveAndFlush(any(MeetingSummaryEntity.class));
        }

        @Test
        void updateSummary_userNotInProject_returnsFailForbidden() {
                // Given
                long summaryId = 1L;
                long userId = 2L;
                long projectId = 100L;

                var project = fixture.giveMeBuilder(ProjectEntity.class)
                                .set("id", projectId)
                                .sample();
                var summary = fixture.giveMeBuilder(MeetingSummaryEntity.class)
                                .set("id", summaryId)
                                .set("project", project)
                                .set("title", "old-title")
                                .set("summaryMd", "old-md")
                                .sample();
                var user = fixture.giveMeBuilder(UserEntity.class)
                                .set("id", userId)
                                .sample();

                when(meetingSummaryRepository.findById(summaryId)).thenReturn(Optional.of(summary));
                when(userRepository.findById(userId)).thenReturn(Optional.of(user));
                when(projectUserRepository.existsByProject_IdAndUser_Id(projectId, userId)).thenReturn(false);

                // When
                Result<?> result = sut.UpdateSummary(summaryId, userId, new UpdateSummaryCommand("t", "md"));

                // Then
                assertTrue(result.isFailure());
                assertFalse(result.isSuccess());
                assertNotNull(result.getErrors());
                assertFalse(result.getErrors().isEmpty());
                assertTrue(result.getValue().isEmpty());

                assertTrue(result.getErrors().stream().anyMatch(e -> e instanceof ForbiddenError &&
                                e.getCode() == 403 &&
                                e.getMessage() != null &&
                                e.getMessage().contains("프로젝트")));

                verify(meetingSummaryRepository, never()).saveAndFlush(any(MeetingSummaryEntity.class));
        }

        // ---------- UpdateSummaryByAi ----------

        @Test
        void updateSummaryByAi_existingSummary_returnsOk() {
                // Given
                long summaryId = 1L;

                var project = fixture.giveMeBuilder(ProjectEntity.class)
                                .set("id", 100L)
                                .sample();
                var summary = fixture.giveMeBuilder(MeetingSummaryEntity.class)
                                .set("id", summaryId)
                                .set("project", project)
                                .set("title", "t")
                                .set("summaryMd", "old-md")
                                .sample();

                when(meetingSummaryRepository.findById(summaryId)).thenReturn(Optional.of(summary));

                // When
                Result<?> result = sut.UpdateSummaryByAi(summaryId, "ai-title", "ai-md");

                // Then
                assertSuccess(result);
                verify(meetingSummaryRepository, times(1)).saveAndFlush(any(MeetingSummaryEntity.class));
        }

        @Test
        void updateSummaryByAi_summaryNotFound_returnsFailNotFound() {
                // Given
                long summaryId = 1L;
                when(meetingSummaryRepository.findById(summaryId)).thenReturn(Optional.empty());

                // When
                Result<?> result = sut.UpdateSummaryByAi(summaryId, "ai-title", "ai-md");

                // Then
                assertFailNotFound(result, "summaryId", summaryId);
                verify(meetingSummaryRepository, never()).saveAndFlush(any(MeetingSummaryEntity.class));
        }

        // ---------- DeleteSummary ----------

        @Test
        void deleteSummary_existingSummary_returnsOk() {
                // Given
                long summaryId = 1L;

                var project = fixture.giveMeBuilder(ProjectEntity.class)
                                .set("id", 100L)
                                .sample();
                var summary = fixture.giveMeBuilder(MeetingSummaryEntity.class)
                                .set("id", summaryId)
                                .set("project", project)
                                .set("title", "t")
                                .set("summaryMd", "md")
                                .sample();

                when(meetingSummaryRepository.findById(summaryId)).thenReturn(Optional.of(summary));

                // When
                Result<?> result = sut.DeleteSummary(summaryId);

                // Then
                assertSuccess(result);
                verify(meetingSummaryRepository, times(1)).deleteById(summaryId);
                verify(meetingSummaryRepository, times(1)).flush();
        }

        @Test
        void deleteSummary_summaryNotFound_returnsFailNotFound() {
                // Given
                long summaryId = 1L;
                when(meetingSummaryRepository.findById(summaryId)).thenReturn(Optional.empty());

                // When
                Result<?> result = sut.DeleteSummary(summaryId);

                // Then
                assertFailNotFound(result, "summaryId", summaryId);
                verify(meetingSummaryRepository, never()).deleteById(anyLong());
                verify(meetingSummaryRepository, never()).flush();
        }

        // ---------- Assertion Helpers (Result<T> Contract) ----------

        private void assertSuccess(Result<?> result) {
                assertTrue(result.isSuccess());
                assertFalse(result.isFailure());
                assertNotNull(result.getErrors());
                assertTrue(result.getErrors().isEmpty());
        }

        private void assertFailNotFound(Result<?> result, String resourceName, Object key) {
                assertTrue(result.isFailure());
                assertFalse(result.isSuccess());
                assertNotNull(result.getErrors());
                assertFalse(result.getErrors().isEmpty());
                assertTrue(result.getValue().isEmpty());

                assertTrue(result.getErrors().stream().anyMatch(e -> e instanceof NotFoundError &&
                                e.getCode() == 404 &&
                                hasMetadata(e, "resource", resourceName) &&
                                hasMetadata(e, "key", key)));
        }

        private boolean hasMetadata(ResultError error, String k, Object v) {
                Map<String, Object> metadata = error.getMetadata();
                if (metadata == null)
                        return false;
                if (!metadata.containsKey(k))
                        return false;
                Object actual = metadata.get(k);
                return (actual == null && v == null) || (actual != null && actual.equals(v));
        }
}
