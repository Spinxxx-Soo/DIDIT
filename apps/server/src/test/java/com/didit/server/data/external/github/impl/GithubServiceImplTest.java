package com.didit.server.data.external.github.impl;

import com.didit.server.api.response.GithubRepoResponse;
import com.didit.server.data.entity.ProjectEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.entity.UserGithubAuthEntity;
import com.didit.server.data.external.github.GithubService;
import com.didit.server.data.repository.ProjectRepository;
import com.didit.server.data.repository.ProjectUserRepository;
import com.didit.server.data.repository.UserGithubAuthRepository;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.service.service.ProjectService;
import com.didit.server.service.service.impl.ProjectServiceImpl;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.ForbiddenError;
import com.didit.server.share.result.impl.NotFoundError;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kohsuke.github.*;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GithubServiceImplTest {

    @InjectMocks
    private GithubServiceImpl githubService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserGithubAuthRepository userGithubAuthRepository;

    @Mock
    private GHRepository ghRepository;

    @Mock
    private GHIssueBuilder ghIssueBuilder;

    @Mock
    private GHIssue ghIssue;

    @Test
    @DisplayName("GitHub 이슈 생성 성공 - 권한 확인 및 담당자 매핑 후 생성")
    void createIssue_success() throws IOException {
        try (MockedConstruction<GitHubBuilder> ignored = mockConstruction(GitHubBuilder.class, (mock, context) -> {
            given(mock.withOAuthToken(anyString())).willReturn(mock);
            GitHub mockGitHub = mock(GitHub.class);
            given(mock.build()).willReturn(mockGitHub);

            GHOrganization mockOrg = mock(GHOrganization.class);
            given(mockGitHub.getOrganization(anyString())).willReturn(mockOrg);
            given(mockOrg.getRepository(anyString())).willReturn(ghRepository);
        })) {
            // Given
            String token = "access_token";
            String githubAuth = "tester";
            List<Long> assigneeIds = List.of(1L);

            given(ghRepository.getPermission(githubAuth)).willReturn(GHPermissionType.WRITE);
            given(userRepository.findById(1L)).willReturn(Optional.of(UserEntity.builder().githubLogin("assignee-user").build()));

            given(ghRepository.createIssue(anyString())).willReturn(ghIssueBuilder);
            given(ghIssueBuilder.body(anyString())).willReturn(ghIssueBuilder);
            given(ghIssueBuilder.create()).willReturn(ghIssue);

            // When
            Result<GHIssue> result = githubService.createIssue(token, githubAuth, "org", "repo", "Title", "Body", assigneeIds);

            // Then
            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getValue().get()).isEqualTo(ghIssue);

            verify(ghIssueBuilder).assignee("assignee-user");
        }
    }

    @Test
    @DisplayName("GitHub 이슈 생성 실패 - WRITE 권한 미달 시 ForbiddenError 반환")
    void createIssue_fail_forbidden() throws IOException {
        try (MockedConstruction<GitHubBuilder> ignored = mockConstruction(GitHubBuilder.class, (mock, context) -> {
            GitHub mockGitHub = mock(GitHub.class);
            given(mock.withOAuthToken(anyString())).willReturn(mock);
            given(mock.build()).willReturn(mockGitHub);
            GHOrganization mockOrg = mock(GHOrganization.class);
            given(mockGitHub.getOrganization(anyString())).willReturn(mockOrg);
            given(mockOrg.getRepository(anyString())).willReturn(ghRepository);
        })) {
            // Given
            given(ghRepository.getPermission(anyString())).willReturn(GHPermissionType.READ);

            // When
            Result<GHIssue> result = githubService.createIssue("token", "user", "org", "repo", "T", "B", List.of());

            // Then
            assertThat(result.isFailure()).isTrue();
            assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ForbiddenError.class);
            verify(ghRepository, never()).createIssue(anyString());
        }
    }

    @Test
    @DisplayName("GitHub 이슈 생성 실패 - 네트워크 오류(IOException) 발생 시 예외 전파")
    void createIssue_fail_networkError() throws IOException {
        try (MockedConstruction<GitHubBuilder> ignored = mockConstruction(GitHubBuilder.class, (mock, context) -> {
            given(mock.withOAuthToken(anyString())).willReturn(mock);
            given(mock.build()).willThrow(new IOException("Connection Timeout"));
        })) {
            // When & Then
            assertThatThrownBy(() ->
                    githubService.createIssue("token", "user", "org", "repo", "T", "B", List.of())
            ).isInstanceOf(IOException.class)
                    .hasMessageContaining("Connection Timeout");
        }
    }

    @Test
    @DisplayName("저장소 검증 성공 - GitHub API를 통해 실재하는 저장소 정보를 반환함")
    void validateGithubRepo_success() throws IOException {
        try (MockedConstruction<GitHubBuilder> ignored = mockConstruction(GitHubBuilder.class, (mock, context) -> {
            given(mock.withOAuthToken(anyString())).willReturn(mock);

            GitHub mockGitHub = mock(GitHub.class);
            given(mock.build()).willReturn(mockGitHub);

            given(mockGitHub.getRepository(anyString())).willReturn(ghRepository);
        })) {
            // Given
            long projectId = 1L;
            long userId = 10L;
            String orgName = "test-org";
            String repoName = "test-repo";
            String fullName = orgName + "/" + repoName;
            String accessToken = "ghp_valid_token";

            given(ghRepository.getId()).willReturn(12345L);
            given(ghRepository.getFullName()).willReturn(fullName);

            ProjectEntity project = ProjectEntity.builder()
                    .id(projectId)
                    .owner(UserEntity.builder().id(userId).build())
                    .build();
            given(projectRepository.findById(projectId)).willReturn(Optional.of(project));

            UserGithubAuthEntity auth = UserGithubAuthEntity.builder()
                    .accessToken(accessToken)
                    .build();
            given(userGithubAuthRepository.findById(userId)).willReturn(Optional.of(auth));

            // When
            Result<GithubRepoResponse> result = githubService.validateGithubRepo(projectId, userId, orgName, repoName);

            // Then
            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getOrThrow().getRepoId()).isEqualTo(12345L);
            assertThat(result.getOrThrow().getRepoName()).isEqualTo(fullName);
        }
    }

    @Test
    @DisplayName("저장소 검증 실패 - 프로젝트 소유자가 아닌 경우 ForbiddenError 반환")
    void validateGithubRepo_fail_forbiddenOwner() throws IOException {
        // Given
        long projectId = 1L;
        long userId = 10L;
        long differentUserId = 99L;

        ProjectEntity project = ProjectEntity.builder()
                .id(projectId)
                .owner(UserEntity.builder().id(differentUserId).build())
                .build();

        given(projectRepository.findById(projectId)).willReturn(Optional.of(project));

        // When
        Result<GithubRepoResponse> result = githubService.validateGithubRepo(projectId, userId, "org", "repo");

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ForbiddenError.class);
    }

    @Test
    @DisplayName("저장소 검증 실패 - GitHub에 해당 레포지토리가 없는 경우 NotFoundError 반환")
    void validateGithubRepo_fail_repoNotFound() throws IOException {
        // Given
        long projectId = 1L;
        long userId = 10L;

        ProjectEntity project = ProjectEntity.builder()
                .id(projectId)
                .owner(UserEntity.builder().id(userId).build())
                .build();
        given(projectRepository.findById(projectId)).willReturn(Optional.of(project));
        given(userGithubAuthRepository.findById(userId)).willReturn(Optional.of(UserGithubAuthEntity.builder().accessToken("token").build()));

        // When
        Result<GithubRepoResponse> result = githubService.validateGithubRepo(projectId, userId, "invalid", "repo");

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(NotFoundError.class);
    }
}