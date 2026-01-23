package com.didit.server.service.service.impl;

import com.didit.server.data.entity.IssueEntity;
import com.didit.server.data.entity.ProjectEntity;
import com.didit.server.data.entity.enums.IssueStatus;
import com.didit.server.data.repository.IssueRepository;
import com.didit.server.data.repository.ProjectRepository;
import com.didit.server.share.result.Result;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IssueServiceImplTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private IssueRepository issueRepository;

    @InjectMocks
    private IssueServiceImpl issueService;

    @Test
    @DisplayName("유효한 projectId가 주어지면 활성화된 이슈 리스트 5개를 반환한다.")
    void GetActiveIssues_Success() {
        // Given
        long projectId = 1L;
        ProjectEntity project = ProjectEntity.builder().id(projectId).build();
        List<IssueEntity> issues = List.of(
                IssueEntity.builder().id(101L).title("Issue 1").status(IssueStatus.OPEN).build(),
                IssueEntity.builder().id(102L).title("Issue 2").status(IssueStatus.OPEN).build()
        );

        given(projectRepository.findById(projectId)).willReturn(Optional.of(project));
        given(issueRepository.findTop5ByProject_IdAndStatusOrderByUpdatedAtDesc(projectId, IssueStatus.OPEN))
                .willReturn(issues);

        // When
        Result<List<IssueEntity>> result = issueService.GetActiveIssues(projectId);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getOrThrow()).hasSize(2);
        assertThat(result.getOrThrow().get(0).getId()).isEqualTo(101L);

        verify(projectRepository, times(1)).findById(projectId);
        verify(issueRepository, times(1)).findTop5ByProject_IdAndStatusOrderByUpdatedAtDesc(projectId, IssueStatus.OPEN);
    }

    @Test
    @DisplayName("존재하지 않는 projectId가 주어지면 NotFoundError(404)를 반환한다.")
    void GetActiveIssues_Fail_InvalidProjectId() {
        // Given
        long invalidProjectId = 999L;
        given(projectRepository.findById(invalidProjectId)).willReturn(Optional.empty());

        // When
        Result<List<IssueEntity>> result = issueService.GetActiveIssues(invalidProjectId);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow().getStatus().value()).isEqualTo(404);
        assertThat(result.getSingleErrorOrThrow().getMessage()).contains("projectId not found");

        verify(issueRepository, never()).findTop5ByProject_IdAndStatusOrderByUpdatedAtDesc(anyLong(), any());
    }

    @Test
    @DisplayName("조회 중 예외가 발생하면 ServerError(500)를 반환한다.")
    void GetActiveIssues_Fail_InternalServerError() {
        // Given
        long projectId = 1L;
        given(projectRepository.findById(projectId)).willReturn(Optional.of(ProjectEntity.builder().id(projectId).build()));
        given(issueRepository.findTop5ByProject_IdAndStatusOrderByUpdatedAtDesc(anyLong(), any()))
                .willThrow(new RuntimeException("Database Connection Error"));

        // When
        Result<List<IssueEntity>> result = issueService.GetActiveIssues(projectId);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow().getStatus().value()).isEqualTo(500);
        assertThat(result.getSingleErrorOrThrow().getMessage()).contains("IssueList");
    }
}