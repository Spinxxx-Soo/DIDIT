package com.didit.server.service.service.impl;

import com.didit.server.api.request.AiQueueRequest;
import com.didit.server.api.request.AiSortRequest;
import com.didit.server.api.response.AiResponse;
import com.didit.server.data.entity.IssueEntity;
import com.didit.server.data.entity.ProjectEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.entity.UserGithubAuthEntity;
import com.didit.server.data.entity.enums.IssuePriority;
import com.didit.server.data.entity.enums.IssueStatus;
import com.didit.server.data.entity.enums.ProjectUserStatus;
import com.didit.server.data.external.github.GithubService;
import com.didit.server.data.repository.*;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.ForbiddenError;
import com.didit.server.share.result.impl.NotFoundError;
import com.didit.server.share.result.impl.ServerError;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.kohsuke.github.GHIssue;
import org.kohsuke.github.GHIssueBuilder;
import org.kohsuke.github.GHPermissionType;
import org.kohsuke.github.GHRepository;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.RedisTemplate;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IssueServiceImplTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectUserRepository projectUserRepository;

    @Mock
    private IssueRepository issueRepository;

    @InjectMocks
    private IssueServiceImpl issueService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ListOperations<String, Object> listOperations;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private GHRepository ghRepository;

    @Mock
    private GHIssueBuilder ghIssueBuilder;

    @Mock
    private UserGithubAuthRepository userGithubAuthRepository;

    @Mock
    private GHIssue ghIssue;

    @Mock
    private GithubService githubService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForList()).thenReturn(listOperations);
    }

    @Test
    @DisplayName("존재하지 않는 projectId가 주어지면 NotFoundError(404)를 반환한다.")
    void GetActiveIssues_Fail_InvalidProjectId() {
        // Given
        long invalidProjectId = 999L;
        long userId = 10L;
        given(projectRepository.findById(invalidProjectId)).willReturn(Optional.empty());

        // When
        Result<List<IssueEntity>> result = issueService.GetActiveIssues(userId, invalidProjectId);

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
        long userId = 10L;
        given(projectRepository.findById(projectId)).willReturn(Optional.of(ProjectEntity.builder().id(projectId).build()));
        given(issueRepository.findTop5ByProject_IdAndStatusOrderByUpdatedAtDesc(anyLong(), any()))
                .willThrow(new RuntimeException("Database Connection Error"));

        // When
        Result<List<IssueEntity>> result = issueService.GetActiveIssues(userId, projectId);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow().getStatus().value()).isEqualTo(500);
        assertThat(result.getSingleErrorOrThrow().getMessage()).contains("IssueList");
    }

    @Test
    @DisplayName("이슈 분석 요청 성공 - DB 임시 저장 및 Redis 큐 삽입 확인")
    void analyzeIssue_success() throws JsonProcessingException {
        // Given
        long projectId = 1L;
        long userId = 10L;
        long generatedIssueId = 1L;
        String title = "테스트 이슈 제목";
        String body = "테스트 이슈 내용";
        IssueStatus status = IssueStatus.OPEN;
        List<Long> assigneeIds = List.of(100L, 200L);

        given(projectRepository.getReferenceById(projectId)).willReturn(ProjectEntity.builder().id(projectId).build());
        given(userRepository.getReferenceById(userId)).willReturn(UserEntity.builder().id(userId).build());
        given(userRepository.getReferenceById(100L)).willReturn(UserEntity.builder().id(100L).build());
        given(userRepository.getReferenceById(200L)).willReturn(UserEntity.builder().id(200L).build());

        given(issueRepository.save(any(IssueEntity.class))).willAnswer(invocation -> {
            IssueEntity entity = invocation.getArgument(0);
            entity.setId(generatedIssueId);
            return entity;
        });

        String jsonPayload = "{\"userId\":10, \"issueId\":1, \"title\":\"테스트 이슈 제목\"}";
        given(objectMapper.writeValueAsString(any(AiQueueRequest.class))).willReturn(jsonPayload);

        // When
        Result<AiResponse> result = issueService.AnalyzeIssue(projectId, userId, title, status, body, assigneeIds);

        // Then
        assertThat(result.isSuccess()).isTrue();
        AiResponse response = result.getOrThrow();

        assertThat(response.getIssueId()).isEqualTo(generatedIssueId);

        verify(issueRepository).save(any(IssueEntity.class));
        verify(listOperations).leftPush(eq("queue:issue:priority:single"), eq(jsonPayload));
    }

    @Test
    @DisplayName("이슈 분석 요청 실패 - Redis 서버 오류 시 ServerError 반환")
    void analyzeIssue_fail_redisConnectionError() throws JsonProcessingException {
        // Given
        long projectId = 1L;
        long userId = 10L;
        long generatedIssueId = 1L;

        given(projectRepository.getReferenceById(projectId)).willReturn(ProjectEntity.builder().id(projectId).build());
        given(userRepository.getReferenceById(userId)).willReturn(UserEntity.builder().id(userId).build());

        given(issueRepository.save(any(IssueEntity.class))).willAnswer(invocation -> {
            IssueEntity entity = invocation.getArgument(0);
            entity.setId(generatedIssueId);
            return entity;
        });

        given(objectMapper.writeValueAsString(any())).willReturn("{\"json\":\"data\"}");

        given(listOperations.leftPush(eq("queue:issue:priority:single"), anyString()))
                .willThrow(new RuntimeException("Redis Connection Refused"));

        // When
        Result<AiResponse> result = issueService.AnalyzeIssue(projectId, userId, "Title", IssueStatus.OPEN, "Body", null);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ServerError.class);
    }

    @Test
    @DisplayName("이슈 최종 등록 성공 - GitHub 생성 후 DB 정보 업데이트 확인")
    void CreateIssue_Success() throws IOException {
        // Given
        long projectId = 1L;
        long userId = 10L;
        long issueId = 100L;
        String orgName = "my-org";
        String repoName = "my-repo";
        IssuePriority finalPriority = IssuePriority.HIGH;

        UserEntity user = UserEntity.builder().id(userId).githubLogin("tester").build();
        UserGithubAuthEntity auth = UserGithubAuthEntity.builder().accessToken("token").user(user).build();
        given(userGithubAuthRepository.findById(userId)).willReturn(Optional.of(auth));

        GHIssue mockRemoteIssue = mock(GHIssue.class);
        given(mockRemoteIssue.getId()).willReturn(555L);
        given(mockRemoteIssue.getNumber()).willReturn(1);
        given(githubService.createIssue(anyString(), anyString(), anyString(), anyString(), anyString(), anyString(), anyList()))
                .willReturn(Result.ok(mockRemoteIssue));

        IssueEntity existingEntity = IssueEntity.builder()
                .id(issueId)
                .author(user)
                .priority(IssuePriority.MEDIUM)
                .build();
        given(issueRepository.findById(issueId)).willReturn(Optional.of(existingEntity));

        // When
        Result<Long> result = issueService.CreateIssue(projectId, userId, orgName, repoName,
                "Title", "Body", List.of(), issueId, finalPriority);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getOrThrow()).isEqualTo(issueId);

        assertThat(existingEntity.getPriority()).isEqualTo(finalPriority);
        assertThat(existingEntity.getGithubIssueId()).isEqualTo(555L);
        assertThat(existingEntity.getIssueNo()).isEqualTo(1);

        verify(issueRepository, times(1)).save(existingEntity);
    }

    @Test
    @DisplayName("이슈 등록 실패 - 타인의 이슈를 수정하려 할 때 ForbiddenError 반환")
    void CreateIssue_Fail_Forbidden_NotAuthor() throws IOException {
        // Given
        long requestUserId = 10L;
        long authorId = 99L;
        long issueId = 100L;

        UserEntity requester = UserEntity.builder().id(requestUserId).build();
        UserEntity author = UserEntity.builder().id(authorId).build();

        IssueEntity entity = IssueEntity.builder().id(issueId).author(author).build();
        given(issueRepository.findById(issueId)).willReturn(Optional.of(entity));

        // When
        Result<Long> result = issueService.CreateIssue(1L, requestUserId, "org", "repo",
                "T", "B", List.of(), issueId, IssuePriority.LOW);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ForbiddenError.class);

        verify(githubService, never()).createIssue(any(), any(), any(), any(), any(), any(), any());
        verify(issueRepository, never()).save(any());
    }

    @Test
    @DisplayName("이슈 등록 실패 - 존재하지 않는 issueId인 경우 NotFoundError(404) 반환")
    void createIssue_fail_notFound() throws IOException {
        // Given
        long issueId = 100L;

        given(issueRepository.findById(issueId)).willReturn(Optional.empty());

        // When
        Result<Long> result = issueService.CreateIssue(1L, 10L, "org", "repo", "T", "B", List.of(), issueId, IssuePriority.HIGH);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(NotFoundError.class);

        verify(githubService, never()).createIssue(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("이슈 등록 실패 - GitHubService에서 권한 부족(403)을 반환한 경우 그대로 전달")
    void createIssue_fail_githubForbidden() throws IOException {
        // Given
        long userId = 10L;
        long issueId = 100L;
        String mockToken = "token";

        UserEntity user = UserEntity.builder().id(userId).githubLogin("tester").build();
        UserGithubAuthEntity auth = UserGithubAuthEntity.builder().accessToken(mockToken).user(user).build();

        given(issueRepository.findById(issueId)).willReturn(Optional.of(IssueEntity.builder().author(user).build()));
        given(userGithubAuthRepository.findById(userId)).willReturn(Optional.of(auth));

        given(githubService.createIssue(eq(mockToken), anyString(), anyString(), anyString(), anyString(), anyString(), anyList()))
                .willReturn(Result.fail(new ForbiddenError("GitHub 권한 부족")));

        // When
        Result<Long> result = issueService.CreateIssue(1L, userId, "org", "repo", "T", "B", List.of(), issueId, IssuePriority.HIGH);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ForbiddenError.class);
        verify(issueRepository, never()).save(any());
    }

    @Test
    @DisplayName("최근 이슈 조회 실패 - 존재하지 않는 프로젝트 ID인 경우 NotFoundError 반환")
    void getActiveIssues_fail_notFound() {
        // Given
        long invalidProjectId = 999L;
        given(projectRepository.findById(invalidProjectId)).willReturn(Optional.empty());

        // When
        Result<List<IssueEntity>> result = issueService.GetActiveIssues(10L, invalidProjectId);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(NotFoundError.class);

        verify(issueRepository, never()).findTop5ByProject_IdAndStatusOrderByUpdatedAtDesc(anyLong(), any());
        verify(listOperations, never()).leftPush(anyString(), any());
    }

    @Test
    @DisplayName("최근 이슈 조회 실패 - Redis 작업 중 예외 발생 시 ServerError 반환")
    void getActiveIssues_fail_redisError() throws JsonProcessingException {
        // Given
        long projectId = 1L;
        given(projectRepository.findById(projectId)).willReturn(Optional.of(ProjectEntity.builder().build()));
        given(issueRepository.findTop5ByProject_IdAndStatusOrderByUpdatedAtDesc(anyLong(), any())).willReturn(List.of());
        given(objectMapper.writeValueAsString(any())).willReturn("{}");

        given(listOperations.leftPush(anyString(), any()))
                .willThrow(new RuntimeException("Redis 연결 실패"));

        // When
        Result<List<IssueEntity>> result = issueService.GetActiveIssues(10L, projectId);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ServerError.class);
        assertThat(result.getSingleErrorOrThrow().getMessage()).contains("IssueList");
    }

    @Test
    @DisplayName("전체 이슈 조회 성공 - 리스트 반환 및 AI 정렬 큐 삽입 확인")
    void getAllIssues_success() throws Exception {
        // Given
        long userId = 1L;
        long projectId = 100L;

        given(projectUserRepository.existsByProject_IdAndUser_IdAndStatus(anyLong(), anyLong(), any()))
                .willReturn(true);

        given(userRepository.findById(anyLong()))
                .willReturn(Optional.of(UserEntity.builder().id(userId).build()));

        // Given 부분 수정
        List<IssueEntity> issues = List.of(
                IssueEntity.builder()
                        .id(10L)
                        .title("이슈 1")
                        .body("내용")
                        .priority(IssuePriority.MEDIUM) // [추가]
                        .build(),
                IssueEntity.builder()
                        .id(11L)
                        .title("이슈 2")
                        .body("내용")
                        .priority(IssuePriority.LOW)    // [추가]
                        .build()
        );
        given(issueRepository.findAllByProject_Id(anyLong())).willReturn(issues);

        String mockJson = "{\"userId\":1}";
        given(objectMapper.writeValueAsString(any())).willReturn(mockJson);

        // When
        Result<List<IssueEntity>> result = issueService.GetAllIssues(userId, projectId);

        // Then
        if (result.isFailure()) {
            System.out.println("Error Message: " + result.getSingleErrorOrThrow().getMessage());
        }

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getOrThrow()).hasSize(2);

        verify(issueRepository).findAllByProject_Id(eq(projectId));
        verify(listOperations).leftPush(anyString(), eq(mockJson));
    }

    @Test
    @DisplayName("전체 이슈 조회 실패 - 프로젝트 멤버가 아닌 경우 ForbiddenError 반환")
    void getAllIssues_fail_forbidden() {
        // Given
        long userId = 1L;
        long projectId = 100L;

        // 멤버십 확인 실패
        given(projectUserRepository.existsByProject_IdAndUser_IdAndStatus(projectId, userId, ProjectUserStatus.ACTIVE)).willReturn(false);

        // When
        Result<List<IssueEntity>> result = issueService.GetAllIssues(userId, projectId);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ForbiddenError.class);

        // 멤버가 아니면 이후 로직(유저 조회, 이슈 조회)은 실행되지 않아야 함
        verify(userRepository, never()).findById(anyLong());
        verify(issueRepository, never()).findAllByProject_Id(anyLong());
    }

    @Test
    @DisplayName("전체 이슈 조회 실패 - 존재하지 않는 유저인 경우 NotFoundError 반환")
    void getAllIssues_fail_userNotFound() {
        // Given
        long userId = 99L;
        long projectId = 100L;

        given(projectUserRepository.existsByProject_IdAndUser_IdAndStatus(projectId, userId, ProjectUserStatus.ACTIVE)).willReturn(true);
        given(userRepository.findById(userId)).willReturn(Optional.empty());

        // When
        Result<List<IssueEntity>> result = issueService.GetAllIssues(userId, projectId);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(NotFoundError.class);
        verify(issueRepository, never()).findAllByProject_Id(anyLong());
    }

    @Test
    @DisplayName("전체 이슈 조회 실패 - DB 예외 발생 시 ServerError 반환")
    void getAllIssues_fail_serverError() {
        // Given
        long userId = 1L;
        long projectId = 100L;

        given(projectUserRepository.existsByProject_IdAndUser_IdAndStatus(projectId, userId, ProjectUserStatus.ACTIVE)).willReturn(true);
        given(userRepository.findById(userId)).willReturn(Optional.of(UserEntity.builder().build()));

        // DB 에러 시뮬레이션
        given(issueRepository.findAllByProject_Id(projectId)).willThrow(new RuntimeException("DB Connection Fail"));

        // When
        Result<List<IssueEntity>> result = issueService.GetAllIssues(userId, projectId);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ServerError.class);
    }

    @Test
    @DisplayName("이슈 수정 성공 - GitHub 동기화 및 DB 정보 업데이트 확인")
    void updateIssue_Success() throws IOException {
        // Given
        long projectId = 1L;
        long userId = 10L;
        long issueId = 100L;
        String newTitle = "수정된 제목";
        String newBody = "수정된 내용";
        List<Long> assigneeIds = List.of(20L);
        IssueStatus issueStatus = IssueStatus.OPEN;
        IssuePriority issuePriority = IssuePriority.MEDIUM;

        UserEntity author = UserEntity.builder().id(userId).githubLogin("author").build();
        ProjectEntity project = ProjectEntity.builder().id(projectId).repoFullName("org/repo").build();
        IssueEntity entity = IssueEntity.builder()
                .id(issueId)
                .author(author)
                .project(project)
                .githubIssueId(555L)
                .issueNo(1)
                .build();

        given(issueRepository.findById(issueId)).willReturn(Optional.of(entity));

        // GitHub 인증 정보 모킹
        UserGithubAuthEntity auth = UserGithubAuthEntity.builder().accessToken("token").build();
        given(userGithubAuthRepository.findById(userId)).willReturn(Optional.of(auth));

        // 담당자 조회 모킹
        UserEntity assignee = UserEntity.builder().id(20L).githubLogin("assignee1").build();
        given(userRepository.findAllById(assigneeIds)).willReturn(List.of(assignee));
        given(userRepository.findById(20L)).willReturn(Optional.of(assignee));

        // GitHub 서비스 성공 모킹
        given(githubService.updateIssue(anyString(), anyString(), anyInt(), anyString(), anyString(), anyList(), any()))
                .willReturn(Result.ok());

        // When
        Result<Void> result = issueService.updateIssue(projectId, userId, issueId, newTitle, newBody, assigneeIds, issueStatus, issuePriority);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(entity.getTitle()).isEqualTo(newTitle);
        assertThat(entity.getBody()).isEqualTo(newBody);
        verify(githubService).updateIssue(eq("token"), eq("org/repo"), eq(1), eq(newTitle), eq(newBody), anyList(), eq(issueStatus));
    }

    @Test
    @DisplayName("이슈 수정 실패 - 요청된 projectId와 이슈의 실제 projectId가 다를 경우 NotFoundError 반환")
    void updateIssue_Fail_ProjectMismatch() {
        // Given
        long projectId = 1L;
        long mismatchProjectId = 2L;
        long issueId = 100L;

        ProjectEntity project = ProjectEntity.builder().id(projectId).build();
        IssueEntity entity = IssueEntity.builder().id(issueId).project(project).build();

        given(issueRepository.findById(issueId)).willReturn(Optional.of(entity));

        // When
        Result<Void> result = issueService.updateIssue(mismatchProjectId, 10L, issueId, "T", "B", null, IssueStatus.OPEN, IssuePriority.MEDIUM);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(NotFoundError.class);
    }

    @Test
    @DisplayName("이슈 수정 실패 - GitHub API 호출 실패 시 Result 그대로 반환")
    void updateIssue_Fail_GitHubError() {
        // Given
        long projectId = 1L;
        long userId = 10L;
        long issueId = 100L;
        UserEntity author = UserEntity.builder().id(userId).build();
        ProjectEntity project = ProjectEntity.builder().id(projectId).repoFullName("org/repo").build();

        IssueEntity entity = IssueEntity.builder()
                .id(issueId)
                .author(author)
                .project(project) // projectId 일치시킴
                .githubIssueId(555L)
                .issueNo(1)
                .build();

        given(issueRepository.findById(issueId)).willReturn(Optional.of(entity));
        given(userGithubAuthRepository.findById(userId)).willReturn(Optional.of(UserGithubAuthEntity.builder().accessToken("t").build()));

        lenient().when(githubService.updateIssue(any(), any(), anyInt(), any(), any(), any(), any()))
                .thenReturn(Result.fail(new ServerError("GitHubAPI", "Error")));

        // When
        Result<Void> result = issueService.updateIssue(projectId, userId, issueId, "T", "B", null, IssueStatus.OPEN, IssuePriority.MEDIUM);

        // Then
        assertThat(result.isFailure()).isTrue();
    }

    @Test
    @DisplayName("이슈 삭제 성공 - GitHub Close 및 DB 삭제 확인")
    void deleteIssue_Success() {
        // Given
        long projectId = 1L;
        long userId = 10L;
        long issueId = 100L;

        UserEntity author = UserEntity.builder().id(userId).build();
        ProjectEntity project = ProjectEntity.builder().id(projectId).repoFullName("org/repo").build();
        IssueEntity entity = IssueEntity.builder()
                .id(issueId)
                .author(author)
                .project(project)
                .githubIssueId(555L)
                .issueNo(1)
                .build();

        given(issueRepository.findById(issueId)).willReturn(Optional.of(entity));
        given(userGithubAuthRepository.findById(userId)).willReturn(Optional.of(UserGithubAuthEntity.builder().accessToken("t").build()));
        given(githubService.closeIssue(anyString(), anyString(), anyInt())).willReturn(Result.ok());

        // When
        Result<Void> result = issueService.deleteIssue(projectId, userId, issueId);

        // Then
        assertThat(result.isSuccess()).isTrue();
        verify(githubService).closeIssue(eq("t"), eq("org/repo"), eq(1));
        verify(issueRepository).delete(entity);
    }

    @Test
    @DisplayName("이슈 삭제 실패 - 작성자가 아닌 경우 ForbiddenError 반환")
    void deleteIssue_Fail_NotAuthor() {
        // Given
        long userId = 10L;
        long otherUserId = 99L;
        IssueEntity entity = IssueEntity.builder()
                .id(100L)
                .author(UserEntity.builder().id(otherUserId).build())
                .project(ProjectEntity.builder().id(1L).build())
                .build();

        given(issueRepository.findById(100L)).willReturn(Optional.of(entity));

        // When
        Result<Void> result = issueService.deleteIssue(1L, userId, 100L);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ForbiddenError.class);
        verify(issueRepository, never()).delete(any());
    }

    @Test
    @DisplayName("이슈 삭제 실패 - GitHub Close 실패 시 DB 삭제하지 않음")
    void deleteIssue_Fail_GitHubCloseError() {
        // Given
        long projectId = 1L;
        long userId = 10L;
        long issueId = 100L;
        UserEntity author = UserEntity.builder().id(userId).build();
        ProjectEntity project = ProjectEntity.builder().id(projectId).repoFullName("org/repo").build();

        IssueEntity entity = IssueEntity.builder()
                .id(issueId)
                .author(author)
                .project(project) // projectId 일치시킴
                .githubIssueId(555L)
                .issueNo(1)
                .build();

        given(issueRepository.findById(issueId)).willReturn(Optional.of(entity));
        given(userGithubAuthRepository.findById(userId)).willReturn(Optional.of(UserGithubAuthEntity.builder().accessToken("t").build()));

        lenient().when(githubService.closeIssue(any(), any(), anyInt()))
                .thenReturn(Result.fail(new ServerError("GitHubAPI", "Fail")));

        // When
        Result<Void> result = issueService.deleteIssue(projectId, userId, issueId);

        // Then
        assertThat(result.isFailure()).isTrue();
        verify(issueRepository, never()).delete(any());
    }
}