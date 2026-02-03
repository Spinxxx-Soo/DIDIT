package com.didit.server.data.external.github.impl;

import com.didit.server.data.external.github.GithubService;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.ForbiddenError;
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
}
