package com.didit.server.data.external.github.impl;

import com.didit.server.api.response.GithubRepoResponse;
import com.didit.server.data.entity.enums.IssueStatus;
import com.didit.server.data.external.github.GithubService;
import com.didit.server.data.repository.ProjectRepository;
import com.didit.server.data.repository.UserGithubAuthRepository;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.ConflictError;
import com.didit.server.share.result.impl.ForbiddenError;
import com.didit.server.share.result.impl.NotFoundError;
import com.didit.server.share.result.impl.ServerError;
import lombok.RequiredArgsConstructor;
import org.kohsuke.github.*;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GithubServiceImpl implements GithubService {

    private final UserRepository userRepository;
    private final UserGithubAuthRepository userGithubAuthRepository;
    private final ProjectRepository projectRepository;

    @Override
    public Result<GHIssue> createIssue(String accessToken, String githubAuth, String orgName, String repoName, String title, String body, List<Long> assigneeIds) throws IOException {
        GitHub gitHub = new GitHubBuilder().withOAuthToken(accessToken).build();
        GHOrganization org = gitHub.getOrganization(orgName);
        GHRepository repo = org.getRepository(repoName);

        GHPermissionType ghPermissionType = repo.getPermission(githubAuth);
        if (ghPermissionType != GHPermissionType.ADMIN && ghPermissionType != GHPermissionType.WRITE){
            return Result.fail(new ForbiddenError("이슈를 생성할 권한이 없습니다."));
        }

        List<String> assigneeGithubIds = new ArrayList<>();
        if (assigneeIds != null && !assigneeIds.isEmpty()) {
            for (Long id : assigneeIds) {
                userRepository.findById(id).ifPresent(u -> {
                    assigneeGithubIds.add(u.getGithubLogin());
                });
            }
        }

        GHIssueBuilder issueBuilder = repo.createIssue(title).body(body);
        for (String githubId : assigneeGithubIds) {
            issueBuilder.assignee(githubId);
        }
        GHIssue issue = issueBuilder.create();

        return Result.ok(issue);
    }

    @Override
    public Result<GithubRepoResponse> validateGithubRepo(long projectId, long userId,
                                                         String orgName, String repoName) throws IOException {
        // 프로젝트 권한, 프로젝트 소유자, 깃헙 실재여부, 엑세스 토큰 권한
        try {
            var project = projectRepository.findById(projectId);
            if (project.isEmpty()){
                return Result.fail(new NotFoundError("projectId", projectId));
            }
            if (!project.get().getOwner().getId().equals(userId)) {
                return Result.fail(new ForbiddenError("프로젝트 소유자만 저장소를 연결할 수 있습니다."));
            }
            var findAuth = userGithubAuthRepository.findById(userId).orElse(null);
            if (findAuth == null || findAuth.getAccessToken() == null){
                return Result.fail(new ForbiddenError("Github 게정 연동이 필요합니다."));
            }
            var accessToken = findAuth.getAccessToken();
            GitHub gitHub = new GitHubBuilder().withOAuthToken(accessToken).build();
            String fullName = orgName + "/" + repoName;
            try {
                GHRepository repo = gitHub.getRepository(fullName);
                boolean isAlreadyUsedByOther = projectRepository.existsByRepoFullNameAndIdNot(repo.getFullName(), projectId);
                if (isAlreadyUsedByOther) {
                    return Result.fail(new ConflictError("이미 다른 프로젝트에 등록된 깃허브 레포지토리입니다."));
                }
                if(!repo.getOwner().getType().equals("Organization")){
                    return Result.fail(new ConflictError("조직에 소속된 레파지토리가 아닙니다."));
                }
                return Result.ok(GithubRepoResponse.builder()
                        .repoId(repo.getId())
                        .repoName(repo.getFullName())
                        .build());
            } catch (IOException e) {
                return Result.fail(new NotFoundError("Github 레포지토리를 찾을 수 없습니다.", fullName));
            }
        } catch (Exception e) {
            return Result.fail(new ServerError("Internal", e.getMessage()));
        }
    }

    @Override
    public Result<Void> updateIssue(String accessToken, String repoFullName, int issueNo,
                                    String title, String body, List<String> assigneeLogins,
                                    IssueStatus issueStatus) {
        try {
            GitHub gitHub = new GitHubBuilder().withOAuthToken(accessToken).build();
            GHRepository repository = gitHub.getRepository(repoFullName);
            GHIssue issue = repository.getIssue(issueNo);

            if (assigneeLogins != null) {
                List<GHUser> ghUsers = new ArrayList<>();
                for (String login : assigneeLogins) {
                    ghUsers.add(gitHub.getUser(login));
                }
                issue.setAssignees(ghUsers);
            }

            issue.setTitle(title);
            issue.setBody(body);

            if (issueStatus == IssueStatus.CLOSED) {
                issue.close();
            } else if (issueStatus == IssueStatus.OPEN) {
                issue.reopen();
            }

            return Result.ok();
        } catch (IOException e) {
            return Result.fail(new ServerError("GitHubAPI", "이슈 수정 중 오류가 발생했습니다."));
        }
    }

    @Override
    public Result<Void> closeIssue(String accessToken, String repoFullName, int issueNo) {
        try {
            GitHub gitHub = new GitHubBuilder().withOAuthToken(accessToken).build();
            GHRepository repository = gitHub.getRepository(repoFullName);
            GHIssue issue = repository.getIssue(issueNo);

            issue.close();

            return Result.ok();
        } catch (IOException e) {
            return Result.fail(new ServerError("GitHubAPI", "이슈 닫기 중 오류가 발생했습니다."));
        }
    }

    @Override
    public Result<List<GHIssue>> getGithubIssues(String accessToken, String repoFullName) {
        try {
            GitHub gitHub = new GitHubBuilder().withOAuthToken(accessToken).build();
            GHRepository repository = gitHub.getRepository(repoFullName);
            List<GHIssue> issues = repository.getIssues(GHIssueState.OPEN);
            return Result.ok(issues);
        } catch (Exception e) {
            return Result.fail(new ServerError("GitHubAPI", "이슈 목록 로드 실패"));
        }
    }
}
