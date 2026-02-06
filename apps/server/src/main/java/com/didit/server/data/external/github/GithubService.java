package com.didit.server.data.external.github;

import com.didit.server.api.response.GithubRepoResponse;
import com.didit.server.data.entity.enums.IssuePriority;
import com.didit.server.data.entity.enums.IssueStatus;
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

    /**
     * Action: GitHub 저장소에 등록된 특정 이슈의 제목, 본문 및 담당자를 수정함
     * Input:
     * - String accessToken: GitHub OAuth2 액세스 토큰
     * - String repoFullName: 대상 레포지토리 풀네임 (예: "owner/repo")
     * - int issueNo: 수정할 GitHub 이슈 번호
     * - String title: 새로운 이슈 제목
     * - String body: 새로운 이슈 본문
     * - List<String> assigneeLogins: 할당할 담당자들의 GitHub 로그인 아이디 리스트
     * Success:
     * - ok(): GitHub API를 통한 이슈 정보 갱신 성공
     * Auth/Permission:
     * - 제공된 토큰이 해당 레포지토리에 대한 'Write' 권한을 가지고 있어야 함
     * Failures:
     * - <500>: GitHub API 호출 실패, 권한 부족 또는 네트워크 오류 시 ServerError 반환
     */
    Result<Void> updateIssue(String accessToken, String repoFullName, int issueNo, String title, String body, List<String> assigneeLogins, IssueStatus issueStatus);

    /**
     * Action: GitHub 저장소의 특정 이슈 상태를 'CLOSED'로 변경함
     * Input:
     * - String accessToken: GitHub OAuth2 액세스 토큰
     * - String repoFullName: 대상 레포지토리 풀네임 (예: "owner/repo")
     * - int issueNo: 닫을 GitHub 이슈 번호
     * Success:
     * - ok(): GitHub 이슈 상태 변경 성공
     * Auth/Permission:
     * - 해당 이슈를 닫을 수 있는 권한(작성자 또는 레포지토리 관리자)이 있는 토큰 필요
     * Failures:
     * - <500>: GitHub API 호출 실패 또는 권한 부족 시 ServerError 반환
     */
    Result<Void> closeIssue(String accessToken, String repoFullName, int issueNo);

    /**
     * Action: GitHub 저장소에서 현재 열려 있는(OPEN) 모든 이슈 목록을 가져옴
     * Input:
     * - String accessToken: GitHub OAuth 인증을 위한 개인 액세스 토큰
     * - String repoFullName: 대상 저장소의 전체 이름 (예: "owner/repository")
     * Success:
     * - ok(List<GHIssue>): 해당 저장소의 OPEN 상태 이슈 리스트 반환
     * Logic:
     * - OAuth 토큰을 사용하여 GitHub API 클라이언트를 빌드함
     * - 지정된 저장소에 접근하여 'OPEN' 상태인 이슈들만 필터링하여 조회함
     * Failures:
     * - <500>: GitHub API 인증 실패, 저장소 권한 없음, 또는 네트워크 통신 장애 시 ServerError 반환
     */
    Result<List<GHIssue>> getGithubIssues(String accessToken, String repoFullName);
}
