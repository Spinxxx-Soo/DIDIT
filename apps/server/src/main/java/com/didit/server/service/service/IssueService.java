package com.didit.server.service.service;

import com.didit.server.api.response.AiResponse;
import com.didit.server.data.entity.IssueEntity;
import com.didit.server.data.entity.enums.IssuePriority;
import com.didit.server.data.entity.enums.IssueStatus;
import com.didit.server.share.result.Result;

import java.util.List;

public interface IssueService {

    /**
     * Action: 특정 프로젝트의 활성화된 이슈 5개를 조회하고, AI에게 우선순위 기반 재정렬 분석을 비동기로 요청함
     * Input:
     * - long userId: 요청을 보낸 사용자 ID (AI 분석 요청 주체 식별용)
     * - long projectId: 조회할 프로젝트 ID
     * Success:
     * - ok(List<IssueEntity>): DB에서 조회된 최신 수정순 이슈 리스트 (최대 5개).
     * 분석 결과는 이후 SSE(ai_sort_result)를 통해 비동기로 전달됨.
     * Auth/Permission:
     * - 프로젝트 참여자만 조회 및 분석 요청 가능
     * Persistence:
     * - (조회) issueRepository를 통해 OPEN 상태의 이슈 5개를 최신 수정순으로 획득
     * - (연결) Redis 큐(queue:issue:priority:sort)에 조회된 이슈 ID 리스트를 삽입하여 AI 정렬 작업 시작
     * Failures:
     * - <404>: 존재하지 않는 projectId인 경우 NotFoundError 반환
     * - <500>: DB 조회 실패 또는 Redis 큐 삽입 중 오류 발생 시 ServerError 반환
     */
    Result<List<IssueEntity>> GetActiveIssues(long userId, long projectId);

    /**
     * Action: 사용자가 입력한 이슈 내용을 바탕으로 AI에게 우선순위 분석을 요청하고, 해당 이슈를 DB에 임시 저장함
     * Input:
     * - long projectId: 이슈가 소속될 프로젝트 ID
     * - long userId: 이슈를 작성하는 사용자 ID
     * - String title: 이슈 제목
     * - IssueStatus status: 이슈 상태 (사용자가 선택한 초기 상태)
     * - String body: 이슈 상세 내용
     * - List<Long> assigneeIds: 담당자들의 ID 리스트
     * Success:
     * - ok(AiResponse): DB에 저장된 이슈 PK와 입력 정보를 반환하며, 클라이언트는 이를 통해 SSE 분석 결과를 대기함
     * Auth/Permission:
     * - 프로젝트에 소속된 인증된 사용자만 요청 가능
     * Persistence:
     * - (저장) IssueEntity를 생성하여 issueRepository.save 호출 (초기 우선순위는 MEDIUM으로 설정)
     * - (연결) Redis 큐(queue:issue:priority:single)에 userId를 포함한 분석 작업을 삽입하여 비동기 처리 시작
     * Failures:
     * - <500>: Redis 작업 삽입 실패 시 ServerError 반환
     */
    Result<AiResponse> AnalyzeIssue(long projectId, long userId, String title, IssueStatus status, String body, List<Long> assigneeIds);

    /**
     * Action: 임시 저장된 이슈를 실제 GitHub 레포지토리에 등록하고, 사용자가 최종 수정한 정보를 바탕으로 DB를 업데이트함
     * Input:
     * - long projectId: 소속 프로젝트 ID
     * - long userId: 등록을 시도하는 사용자 ID
     * - String orgName: GitHub 조직명
     * - String repoName: GitHub 레포지토리명
     * - String title: 최종 결정된 이슈 제목 (사용자 수정 가능)
     * - String body: 최종 결정된 이슈 상세 내용 (사용자 수정 가능)
     * - List<Long> assigneeIds: 최종 담당자 리스트
     * - long issueId: 우리 DB에 저장된 이슈 PK
     * - IssuePriority issuePriority: 사용자가 최종 선택 또는 수정한 이슈 우선순위
     * Success:
     * - ok(Long): GitHub 등록 및 DB 업데이트가 완료된 이슈의 PK 반환
     * Auth/Permission:
     * - 이슈의 최초 작성자(Author)와 요청 유저(userId)가 일치해야 함
     * - (위임) GitHubService를 통해 해당 레포지토리의 WRITE 이상 권한 여부를 검증함
     * Persistence:
     * - (조회) issueRepository를 통해 기존 임시 이슈 엔티티를 획득함
     * - (수정) 사용자가 전달한 최종 우선순위(issuePriority) 반영 및 GitHub에서 발급받은 issueNo, githubIssueId를 업데이트함
     * Failures:
     * - <403>: 타인의 이슈를 등록하려 하거나, GitHubService에서 권한 부족(ForbiddenError)을 반환한 경우
     * - <404>: 존재하지 않는 issueId인 경우 NotFoundError 반환
     * - <500>: GitHub API 호출 실패 또는 기타 내부 시스템 오류 발생 시 ServerError 반환
     */
    Result<Long> CreateIssue(long projectId, long userId, String orgName, String repoName, String title, String body, List<Long> assigneeIds, long issueId, IssuePriority issuePriority);

    /**
     * Action: 특정 프로젝트의 모든 이슈 목록을 조회함
     * Input:
     * - long userId: 요청자 ID (멤버십 확인용)
     * - long projectId: 조회 대상 프로젝트 ID
     * Success:
     * - ok(List<IssueEntity>): 프로젝트에 속한 전체 이슈 리스트
     * Auth/Permission:
     * - projectUserRepository를 통해 해당 프로젝트의 멤버인지 직접 확인 (403)
     * Failures:
     * - <403>: 프로젝트 멤버가 아닌 경우 ForbiddenError 반환
     * - <500>: 시스템 내부 오류 발생 시 ServerError 반환
     */
    Result<List<IssueEntity>> GetAllIssues(long userId, long projectId);

    /**
     * Action: 기존 이슈의 정보를 수정하고 GitHub 저장소와 동기화함
     * Input:
     * - long projectId: 이슈가 속한 프로젝트 ID (검증용)
     * - long userId: 수정을 요청한 사용자 ID (작성자 권한 확인용)
     * - long issueId: 수정 대상 이슈 ID
     * - String title: 수정할 제목
     * - String body: 수정할 본문 내용
     * - List<Long> assigneeIds: 수정할 담당자 ID 리스트
     * Success:
     * - ok(): 로컬 DB 수정 및 GitHub API(제목, 본문, 담당자) 업데이트 성공
     * Auth/Permission:
     * - 해당 이슈의 작성자(Author) 본인만 수정 가능 (403)
     * - 요청된 projectId가 실제 이슈가 속한 프로젝트와 일치해야 함 (404)
     * - GitHub 연동 이슈인 경우, 요청자의 유효한 GitHub AccessToken이 필수임
     * Failures:
     * - <404>: 이슈가 존재하지 않거나, 요청된 프로젝트에 속하지 않은 이슈인 경우 NotFoundError 반환
     * - <403>: 작성자가 아니거나 유효한 GitHub 인증 정보가 없는 경우 ForbiddenError 반환
     * - <500>: GitHub API 통신 장애 또는 시스템 내부 오류 발생 시 ServerError 반환
     */
    Result<Void> updateIssue(long projectId, long userId, long issueId, String title, String body, List<Long> assigneeIds);

    /**
     * Action: 로컬 DB에서 이슈를 삭제하고, GitHub 저장소의 해당 이슈를 'CLOSED' 상태로 변경함
     * Input:
     * - long projectId: 이슈가 속한 프로젝트 ID (검증용)
     * - long userId: 삭제를 요청한 사용자 ID (작성자 권한 확인용)
     * - long issueId: 삭제 대상 이슈 ID
     * Success:
     * - ok(): DB 데이터 삭제 및 GitHub 이슈 Close 처리 성공
     * Auth/Permission:
     * - 해당 이슈의 작성자(Author) 본인만 삭제 가능 (403)
     * - 요청된 projectId가 실제 이슈가 속한 프로젝트와 일치해야 함 (404)
     * - GitHub 연동 이슈인 경우, 요청자의 유효한 GitHub AccessToken이 필수임
     * Failures:
     * - <404>: 이슈가 존재하지 않거나, 요청된 프로젝트에 속하지 않은 이슈인 경우 NotFoundError 반환
     * - <403>: 삭제 권한이 없거나 유효한 GitHub 인증 정보가 없는 경우 ForbiddenError 반환
     * - <500>: GitHub API 통신 장애 또는 시스템 내부 오류 발생 시 ServerError 반환
     */
    Result<Void> deleteIssue(long projectId, long userId, long issueId);

    Result<IssueEntity> FindById(long issueId);
}
