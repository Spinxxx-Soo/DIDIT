package com.didit.server.data.external.github;

import com.didit.server.share.result.Result;
import org.kohsuke.github.GHIssue;

import java.io.IOException;
import java.util.List;

public interface GithubService {
    /**
     * Action: 지정된 GitHub 레포지토리에 새로운 이슈를 생성함
     * Input:
     * - String accessToken: GitHub OAuth 액세스 토큰
     * - String githubAuth: 권한 확인을 위한 요청자의 GitHub 로그인 ID
     * - String orgName: GitHub 조직(Organization)명
     * - String repoName: GitHub 레포지토리명
     * - String title: 생성할 이슈 제목
     * - String body: 생성할 이슈 본문 내용
     * - List<Long> assigneeIds: 이슈 담당자로 지정할 사용자들의 DB PK 리스트
     * Success:
     * - ok(GHIssue): GitHub에 성공적으로 생성된 이슈 객체를 반환함
     * Auth/Permission:
     * - 해당 레포지토리에 대해 ADMIN 또는 WRITE 권한이 있어야 함
     * Failures:
     * - <403>: 해당 레포지토리에 대한 쓰기 권한이 없을 경우 ForbiddenError 반환
     * - <IOException>: GitHub API 통신 중 네트워크 오류 발생 시 상위 계층으로 예외를 던짐
     */
    Result<GHIssue> createIssue(String accessToken, String githubAuth, String orgName, String repoName, String title, String body, List<Long> assigneeIds) throws IOException;
}
