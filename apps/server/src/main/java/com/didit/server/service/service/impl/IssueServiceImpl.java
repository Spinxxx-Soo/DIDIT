package com.didit.server.service.service.impl;

import com.didit.server.api.request.AiQueueRequest;
import com.didit.server.api.request.AiSortRequest;
import com.didit.server.api.response.AiResponse;
import com.didit.server.data.entity.IssueAssigneeEntity;
import com.didit.server.data.entity.IssueEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.entity.enums.IssuePriority;
import com.didit.server.data.entity.enums.IssueStatus;
import com.didit.server.data.entity.enums.ProjectUserStatus;
import com.didit.server.data.external.github.GithubService;
import com.didit.server.data.repository.*;
import com.didit.server.service.service.IssueService;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.ForbiddenError;
import com.didit.server.share.result.impl.NotFoundError;
import com.didit.server.share.result.impl.ServerError;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

    private final ProjectRepository projectRepository;
    private final ProjectUserRepository projectUserRepository;
    private final IssueRepository issueRepository;
    private final UserGithubAuthRepository userGithubAuthRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private final GithubService githubService;

    @Override
    public Result<List<IssueEntity>> GetActiveIssues(long userId, long projectId) {
        try {
            var project = projectRepository.findById(projectId);
            if(project.isEmpty()){
                return Result.fail(new NotFoundError("projectId", projectId));
            }
            var list = issueRepository.findTop5ByProject_IdAndStatusOrderByUpdatedAtDesc(projectId, IssueStatus.OPEN);
            List<AiSortRequest.AiIssueInfo> issueInfos = list.stream().map(issue -> new AiSortRequest.AiIssueInfo(
                            issue.getId(),
                            issue.getTitle(),
                            issue.getBody(),
                            issue.getPriority().name())).toList();
            AiSortRequest request = new AiSortRequest(userId, projectId, issueInfos);
            String jsonPayload = objectMapper.writeValueAsString(request);
            redisTemplate.opsForList().leftPush("queue:issue:priority:sort", jsonPayload);
            return Result.ok(list);
        }catch (Exception e) {
            return Result.fail(new ServerError("IssueList", projectId));
        }
    }

    @Override
    public Result<List<IssueEntity>> GetAllIssues(long userId, long projectId){
        try {
            boolean isMember = projectUserRepository.existsByProject_IdAndUser_IdAndStatus(projectId, userId, ProjectUserStatus.ACTIVE);
            if (!isMember) {
                return Result.fail(new ForbiddenError("해당 프로젝트의 멤버만 이슈를 조회할 수 있습니다."));
            }
            var user = userRepository.findById(userId);
            if (user.isEmpty()) {
                return Result.fail(new NotFoundError("userId", userId));
            }
            var issueList = issueRepository.findAllByProject_Id(projectId);

            List<AiSortRequest.AiIssueInfo> issueInfos = issueList.stream().map(issue -> new AiSortRequest.AiIssueInfo(
                    issue.getId(),
                    issue.getTitle(),
                    issue.getBody(),
                    issue.getPriority().name())).toList();
            AiSortRequest request = new AiSortRequest(userId, projectId, issueInfos);
            String jsonPayload = objectMapper.writeValueAsString(request);
            log.info("AI Sort Request Payload: {}", jsonPayload);
            redisTemplate.opsForList().leftPush("queue:issue:priority:sort", jsonPayload);
            return Result.ok(issueList);
        } catch (Exception e) {
            return Result.fail(new ServerError("IssueAllList", projectId));
        }
    }

    @Override
    public Result<IssueEntity> FindById(long issueId) {
        var findResult = issueRepository.findById(issueId);
        return findResult.map(Result::ok).orElseGet(() -> Result.fail(new NotFoundError("issueId", issueId)));
    }

    @Override
    public Result<AiResponse> AnalyzeIssue(long projectId, long userId,
                                           String title, IssueStatus status,
                                           String body, List<Long> assigneeIds){
        try {
            IssueEntity issue = IssueEntity.builder()
                    .project(projectRepository.getReferenceById(projectId))
                    .title(title)
                    .body(body)
                    .status(status)
                    .priority(IssuePriority.MEDIUM)
                    .author(userRepository.getReferenceById(userId))
                    .build();

            if (assigneeIds != null && !assigneeIds.isEmpty()) {
                for (Long id : assigneeIds) {
                    UserEntity user = userRepository.getReferenceById(id);
                    IssueAssigneeEntity assignee = IssueAssigneeEntity.builder()
                            .issue(issue)
                            .user(user)
                            .build();
                    issue.getAssignees().add(assignee);
                }
            }
            issueRepository.save(issue);

            AiQueueRequest queueData = new AiQueueRequest(userId, issue.getId(), title, body);

            String jsonPayload = objectMapper.writeValueAsString(queueData);
            redisTemplate.opsForList().leftPush("queue:issue:priority:single", jsonPayload);

            return Result.ok(AiResponse.builder()
                    .issueId(issue.getId())
                    .title(title)
                    .body(body)
                    .status(issue.getStatus())
                    .priority(issue.getPriority())
                    .assigneeIds(assigneeIds)
                    .build());
        } catch (Exception e) {
            return Result.fail(new ServerError("Internal", e.getMessage()));
        }
    }

    @Override
    @Transactional
    public Result<Long> CreateIssue(long projectId, long userId,
                                    String orgName, String repoName,
                                    String title, String body,
                                    List<Long> assigneeIds, long issueId,
                                    IssuePriority issuePriority){
        try {
            var issueEntity = issueRepository.findById(issueId);
            if(issueEntity.isEmpty()){
                return Result.fail(new NotFoundError("issueId", issueId));
            }
            var entity = issueEntity.get();
            if (entity.getAuthor().getId() != userId) {
                return Result.fail(new ForbiddenError("본인이 작성 중인 이슈만 등록할 수 있습니다."));
            }
            var findAuth = userGithubAuthRepository.findById(userId).orElse(null);
            if (findAuth == null){
                return Result.fail(new ForbiddenError("인증 정보가 없습니다."));
            }
            var accessToken = findAuth.getAccessToken();
            String githubAuth = findAuth.getUser().getGithubLogin();

            var githubResult = githubService.createIssue(accessToken,githubAuth,orgName,repoName,title,body,assigneeIds);
            if (githubResult.isFailure()) {
                return Result.fail(githubResult.getSingleErrorOrThrow());
            }
            GHIssue remoteIssue = githubResult.getValue().get();
            long githubId = remoteIssue.getId();
            int issueNo = remoteIssue.getNumber();

            entity.setTitle(title);
            entity.setBody(body);
            entity.setPriority(issuePriority);
            entity.setGithubIssueId(githubId);
            entity.setIssueNo(issueNo);

            entity.getAssignees().clear();
            if (assigneeIds != null) {
                for (Long id : assigneeIds) {
                    userRepository.findById(id).ifPresent(user -> {
                        entity.getAssignees().add(IssueAssigneeEntity.builder()
                                .issue(entity)
                                .user(user)
                                .build());
                    });
                }
            }

            issueRepository.save(entity);

            return Result.ok(entity.getId());
        } catch (Exception e) {
            return Result.fail(new ServerError("Internal", e.getMessage()));
        }
    }

    @Override
    @Transactional
    public Result<Void> updateIssue(long projectId, long userId, long issueId,
                                    String title, String body, List<Long> assigneeIds,
                                    IssueStatus issueStatus, IssuePriority issuePriority) {
        try {
            var issue = issueRepository.findById(issueId);
            if(issue.isEmpty()){
                return Result.fail(new NotFoundError("issueId", issueId));
            }
            if (!issue.get().getProject().getId().equals(projectId)){
                return Result.fail(new NotFoundError("projectId", projectId));
            }
            var entity = issue.get();
            if (entity.getAuthor().getId() != userId) {
                return Result.fail(new ForbiddenError("이슈 수정 권한이 없습니다."));
            }
            if (entity.getGithubIssueId() != null) {
                var auth = userGithubAuthRepository.findById(userId).orElse(null);
                if (auth == null) {
                    return Result.fail(new ForbiddenError("깃허브 인증 정보가 없습니다."));
                }

                List<String> assigneeLogins = new ArrayList<>();
                if (assigneeIds != null) {
                    assigneeLogins = userRepository.findAllById(assigneeIds).stream()
                            .map(UserEntity::getGithubLogin)
                            .filter(login -> login != null && !login.isEmpty())
                            .toList();
                }

                var gitResult = githubService.updateIssue(auth.getAccessToken(),
                        entity.getProject().getRepoFullName(),
                        entity.getIssueNo(), title, body, assigneeLogins,
                        issueStatus);
                if (gitResult.isFailure()) return gitResult;
            }

            entity.setTitle(title);
            entity.setBody(body);
            entity.setStatus(issueStatus);
            entity.setPriority(issuePriority);

            entity.getAssignees().clear();
            if (assigneeIds != null) {
                for (Long id : assigneeIds) {
                    userRepository.findById(id).ifPresent(user -> {
                        entity.getAssignees().add(IssueAssigneeEntity.builder()
                                .issue(entity)
                                .user(user)
                                .build());
                    });
                }
            }

            return Result.ok();
        } catch (Exception e) {
            return Result.fail(new ServerError("UpdateIssue", issueId));
        }
    }

    @Override
    @Transactional
    public Result<Void> deleteIssue(long projectId, long userId, long issueId) {
        try {
            var issue = issueRepository.findById(issueId);
            if(issue.isEmpty()){
                return Result.fail(new NotFoundError("issueId", issueId));
            }
            if (!issue.get().getProject().getId().equals(projectId)){
                return Result.fail(new NotFoundError("projectId", projectId));
            }
            var entity = issue.get();

            if (entity.getAuthor().getId() != userId) {
                return Result.fail(new ForbiddenError("이슈 삭제 권한이 없습니다."));
            }

            if (entity.getGithubIssueId() != null) {
                var auth = userGithubAuthRepository.findById(userId).orElse(null);
                if (auth == null) {
                    return Result.fail(new ForbiddenError("깃허브 인증 정보가 필요합니다."));
                }

                var gitResult = githubService.closeIssue(
                        auth.getAccessToken(),
                        entity.getProject().getRepoFullName(),
                        entity.getIssueNo()
                );

                if (gitResult.isFailure()) {
                    return Result.fail(gitResult.getSingleErrorOrThrow());
                }
            }

            issueRepository.delete(entity);
            return Result.ok();
        } catch (Exception e) {
            return Result.fail(new ServerError("DeleteIssue", issueId));
        }
    }

    @Override
    @Transactional
    public Result<List<IssueEntity>> getGithubIssues(long projectId, long userId){
        try {
            var project = projectRepository.findById(projectId);
            if(project.isEmpty()){
                return Result.fail(new NotFoundError("projectId", projectId));
            }
            var auth = userGithubAuthRepository.findById(userId).orElse(null);
            if (auth == null) {
                return Result.fail(new ForbiddenError("깃허브 인증 정보가 필요합니다."));
            }
            var issues = githubService.getGithubIssues(auth.getAccessToken(), project.get().getRepoFullName());
            if (issues.isFailure()){
                return Result.fail(new NotFoundError("issues", issues));
            }
            List<IssueEntity> resultEntities = new ArrayList<>();
            for (GHIssue ghIssue : issues.getOrThrow()){
                Optional<IssueEntity> issue = issueRepository.findByGithubIssueId(ghIssue.getId());
                IssueEntity issueEntity;
                if(issueRepository.existsByGithubIssueId(ghIssue.getId())){
                    issueEntity = issue.get();
                    issueEntity.setTitle(ghIssue.getTitle());
                    issueEntity.setBody(ghIssue.getBody());
                    if(ghIssue.getState() == GHIssueState.OPEN){
                        issueEntity.setStatus(IssueStatus.OPEN);
                    }else if(ghIssue.getState() == GHIssueState.CLOSED){
                        issueEntity.setStatus(IssueStatus.CLOSED);
                    }
                }
                else{
                    var user = userRepository.findById(userId).orElse(null);
                    if(user == null) return Result.fail(new NotFoundError("userId", userId));
                    issueEntity = IssueEntity.builder()
                            .project(project.get())
                            .author(user)
                            .githubIssueId(ghIssue.getId())
                            .issueNo(ghIssue.getNumber())
                            .title(ghIssue.getTitle())
                            .body(ghIssue.getBody())
                            .status(IssueStatus.OPEN)
                            .priority(IssuePriority.MEDIUM)
                            .build();
                }

                IssueEntity saved = issueRepository.save(issueEntity);
                List<GHUser> ghAssignees = ghIssue.getAssignees();
                for (GHUser ghUser : ghAssignees) {
                    userRepository.findByGithubLogin(ghUser.getLogin()).ifPresent(mappedUser -> {
                        IssueAssigneeEntity assigneeEntity = IssueAssigneeEntity.builder()
                                .issue(saved)
                                .user(mappedUser)
                                .build();
                        saved.getAssignees().add(assigneeEntity);
                    });
                }

                resultEntities.add(saved);
                AiQueueRequest queueData = new AiQueueRequest(
                        userId,
                        issueEntity.getId(),
                        issueEntity.getTitle(),
                        issueEntity.getBody());
                String jsonPayload = objectMapper.writeValueAsString(queueData);
                redisTemplate.opsForList().leftPush("queue:issue:priority:single", jsonPayload);
            }

            var allIssuesInProject = issueRepository.findAllByProject_IdAndStatus(projectId, IssueStatus.OPEN);
            if (!allIssuesInProject.isEmpty()) {
                List<AiSortRequest.AiIssueInfo> sortIssueInfos = allIssuesInProject.stream()
                        .map(issue -> new AiSortRequest.AiIssueInfo(
                                issue.getId(),
                                issue.getTitle(),
                                issue.getBody(),
                                issue.getPriority() != null ? issue.getPriority().name() : "MEDIUM"))
                        .toList();

                AiSortRequest sortRequest = new AiSortRequest(userId, projectId, sortIssueInfos);
                String sortJsonPayload = objectMapper.writeValueAsString(sortRequest);
                redisTemplate.opsForList().leftPush("queue:issue:priority:sort", sortJsonPayload);
            }
            return Result.ok(allIssuesInProject);

        } catch (Exception e) {
            return Result.fail(new ServerError("SyncGithubIssues", projectId));
        }
    }
}
