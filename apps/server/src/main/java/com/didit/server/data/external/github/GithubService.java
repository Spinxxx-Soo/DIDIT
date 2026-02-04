package com.didit.server.data.external.github;

import com.didit.server.api.response.GithubRepoResponse;
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

    /**
     * Action: 사용자가 입력한 GitHub 저장소 정보를 실제 GitHub API를 통해 검증함
     * Input:
     * - long projectId: 연결 대상 프로젝트 ID
     * - long userId: 검증을 요청한 사용자 ID (프로젝트 소유자 확인용)
     * - String orgName: GitHub 조직명 또는 사용자명
     * - String repoName: GitHub 저장소명
     * Success:
     * - ok(GithubRepoResponse): GitHub에서 확인된 고유 ID(repoId)와 전체 경로(repoFullName) 반환
     * Persistence:
     * - DB를 수정하지 않으며, 오직 외부 API(GitHub)의 실재 여부와 접근 권한만 확인하는 Read-only 작업
     * Failures:
     * - <403>: 프로젝트 소유자가 아니거나 유저의 GitHub Access Token이 없는 경우 ForbiddenError
     * - <404>: 존재하지 않는 프로젝트이거나 GitHub에서 해당 레포지토리를 찾을 수 없는 경우 NotFoundError
     * - <500>: GitHub API 통신 중 내부 서버 오류 발생 시 ServerError
     * @throws IOException GitHub API 통신 중 예외 발생 시
     */
    Result<GithubRepoResponse> validateGithubRepo(long projectId, long userId, String orgName, String repoName) throws IOException;
}
