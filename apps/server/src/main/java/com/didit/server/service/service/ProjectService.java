package com.didit.server.service.service;

import com.didit.server.data.entity.ProjectEntity;
import com.didit.server.data.entity.ProjectRecentEntity;
import com.didit.server.data.entity.ProjectUserEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.service.command.AddProjectCommand;
import com.didit.server.share.result.Result;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ProjectService {
    /**
     * Action: 유저 id를 통해 자신이 참가한 project들을 찾음
     * Input:
     *  - long userId
     * Success:
     *  - ok(List<ProjectEntity>) : (반환값 의미 / 값이 없으면 ok())
     * Auth/Permission:
     *  - (로그인 필요 / 본인의 것만)
     * Persistence:
     *  - (읽기)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - <404>: 찾을수 없는 userId
     */
    public Result<List<ProjectEntity>> findProjectsByUserId(long userId);


    //[Feature][Rooms] 방 생성 + 생성 즉시 목록 반영 (POST /api/v1/rooms) #5
    /**
     * Action: ProjectUser에 User Admin으로 등록함
     * Input:
     *  - long userId
     *  - long projectId
     * Success:
     *  - ok()
     * Auth/Permission:
     *  - (로그인 필요 / 본인만)
     * Persistence:
     *  - (추가)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - <404>: 찾을수 없는 userId
     *  - <404>: 찾을수 없는 projectId
     */
    Result AddProjectAdminUser(long userId, long projectId);

    /**
     * Action: Project를 추가이후 AddProjectAdminUser를 호출해 ProjectUser에 자신을 Admin으로 등록
     * Input:
     *  - long ownerUserId
     *  - String projectName
     *  - String repoFullName
     * Success:
     *  - ok()
     * Auth/Permission:
     *  - (로그인 필요 / 본인만)
     * Persistence:
     *  - (추가)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - <404>: 찾을수 없는 userId
     *  - <407>: 중복되는 repoFullName
     */
    Result AddProject(AddProjectCommand cmd);



    /**
     * Action: Project에대한 초대코드 생성. 어드민 유저만 생성가능, save이후 생선된 UUID 리턴
     * Input:
     *  - long userId
     *  - long projectId
     *  - LocalDateTime expiresAt
     * Success:
     *  - ok(UUID)
     * Auth/Permission:
     *  - (어드민만)
     * Persistence:
     *  - (추가)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - <404> NotFoundError: 찾을수 없는 userId - resourceName = userId
     *  - <404> NotFoundError: 찾을수 없는 projectId - resourceName = projectId
     *  - <403> ForbiddenError: 중복되는 repoFullName
     */
    Result<UUID> AddInviteCode(long userId, long projectId, LocalDateTime expiresAt);

    /**
     * Action: 초대 코드(UUID)를 통해 프로젝트 정보 얻기
     * Input:
     *  - UUID inviteCode
     * Success:
     *  - ok(ProjectEntity)
     * Auth/Permission:
     *  - (누구나)
     * Persistence:
     *  - (추가)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - <404> NotFoundError: 찾을수 없는 inviteCode - resourceName = inviteCode
     *  - <410> GoneError: expire된 inviteCode
     */
    Result<ProjectEntity> FindProjectByInviteCode(UUID inviteCode);


    /**
     * Action: ProjectUser에 User Member으로 등록함
     * Input:
     *  - long userId
     *  - long projectId
     * Success:
     *  - ok()
     * Auth/Permission:
     *  - (로그인 필요 / 본인만)
     * Persistence:
     *  - (추가)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - <404>: 찾을수 없는 userId
     *  - <404>: 찾을수 없는 projectId
     */
    Result AddProjectUser(long userId, long projectId);

    /**
     * Action: Project에 속해있는 유저들을 반환함
     * Input:
     *  - long projectId
     * Success:
     *  - ok(List<UserEntity>)
     * Auth/Permission:
     *  - (누구나)
     * Persistence:
     *  - (찾기)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - <404>: 찾을수 없는 projectId
     */
    Result<List<UserEntity>> FindUsersInProject(long projectId);

    /**
     * Action: Project에 속해있는 자신을 반환함
     * Input:
     *  - long projectId
     *  - long userId
     * Success:
     *  - ok(UserEntity)
     * Auth/Permission:
     *  - (자신)
     * Persistence:
     *  - (찾기)
     * Failures:  // ★ 블랙박스 테스트의 핵심
     *  - <404> NotFoundError: 찾을수 없는 userId - resourceName = userId
     *  - <404> NotFoundError: 찾을수 없는 projectId - resourceName = projectId
     *  - <403> NotFoundError: userId, projectId는 유효하지만 프로젝트에는 속해있지 않음 - resourceName = userId
     */
    Result<ProjectUserEntity> FindProjectUser(long userId, long projectId);

    /**
     * Action: 사용자가 최근에 방문한 프로젝트 목록을 최대 4개까지 최신순으로 반환함
     * Input:
     * - long userId: 조회할 사용자의 ID
     * Success:
     * - ok(List<ProjectRecentEntity>): 최근 방문 기록 엔티티 리스트 (최대 4개, 방문 시각 내림차순 정렬)
     * Auth/Permission:
     * - 로그인한 사용자 본인의 기록만 조회 가능
     * Persistence:
     * - (찾기) _ProjectRecentRepository.findTop4ByUser_IdOrderByLastViewedAtDesc 호출
     * Failures:
     * - <404>: 존재하지 않는 userId인 경우 NotFoundError 반환
     * - <500>: 조회 과정에서 예외 발생 시 ServerError(ProjectRecentList) 반환
     */
    Result<List<ProjectRecentEntity>> GetRecentProjects(long userId);

    /**
     * Action: 특정 프로젝트에 대한 사용자의 방문 기록을 생성하거나 최신 시각으로 갱신함 (Upsert)
     * Input:
     * - long projectId: 방문한 프로젝트의 ID
     * - long userId: 방문한 사용자의 ID
     * Success:
     * - 기존 기록이 존재하면 'lastViewedAt' 시각을 현재로 업데이트하고, 없으면 새로 생성함
     * Persistence:
     * - (찾기) _ProjectRecentRepository.findByUser_IdAndProject_Id 호출
     * - (저장) _ProjectRecentRepository.save 호출 (새 기록일 경우)
     * Remark:
     * - 실제 데이터가 필요한 시점까지 조회를 미루기 위해 getReferenceById를 사용함
     */
    void UpdateRecentView(long projectId, long userId);

    /**
     * Action: 프로젝트 ID를 통해 해당 프로젝트의 상세 정보를 조회함
     * Input:
     * - long projectId: 조회할 프로젝트의 ID
     * Success:
     * - ok(ProjectEntity): 프로젝트 정보가 담긴 엔티티 반환
     * Persistence:
     * - (찾기) _ProjectRepository.findById 호출
     * Failures:
     * - <404>: 존재하지 않는 projectId인 경우 NotFoundError 반환
     * - <500>: 데이터베이스 조회 중 예외 발생 시 ServerError(ProjectDetail) 반환
     */
    Result<ProjectEntity> FindProjectById(long projectId);

    /**
     * Action: 프로젝트를 논리 삭제(Soft Delete)함
     * Input:
     * - long projectId: 삭제 대상 프로젝트 ID
     * - long userId: 삭제를 시도하는 사용자 ID
     * Success:
     * - ok(): 프로젝트 삭제 완료 (deleted_at 업데이트)
     * Auth/Permission:
     * - 프로젝트 소유자(Owner)인 경우에만 삭제 가능 (403)
     * Persistence:
     * - 엔티티의 @SQLDelete 설정에 따라 DB에서는 물리 삭제가 아닌 deleted_at 필드가 현재 시간으로 업데이트됨
     * - 이후 모든 조회 쿼리에서 @SQLRestriction("deleted_at IS NULL")에 의해 제외됨
     * Failures:
     * - <403>: 소유자가 아닌 유저가 삭제를 시도할 경우 ForbiddenError 반환
     * - <404>: 존재하지 않는 프로젝트 ID이거나 이미 삭제된 프로젝트인 경우 NotFoundError 반환
     * - <500>: 데이터베이스 처리 중 시스템 오류 발생 시 ServerError 반환
     */
    Result DeleteProject(long projectId, long userId);

    /**
     * Action: 사용자가 프로젝트 참여 멤버 목록에서 스스로 탈퇴하며, 탈퇴 이력을 남김
     * Input:
     * - long projectId: 탈퇴할 프로젝트 ID
     * - long userId: 탈퇴를 시도하는 사용자 ID
     * Success:
     * - ok(): 탈퇴 처리 완료 (status = 'LEFT', left_at 업데이트)
     * Auth/Permission:
     * - 프로젝트의 현재 멤버여야 함 (404)
     * - 프로젝트 소유자(Owner)는 탈퇴할 수 없음 (403)
     * Persistence:
     * - project_users 테이블에서 해당 행을 삭제하지 않고 status 필드를 'LEFT'로 변경하여 이력을 유지함
     * - @SQLRestriction("status != 'LEFT'") 설정 시, 탈퇴한 유저는 향후 멤버십 검증에서 자동으로 제외됨
     * Failures:
     * - <403>: 소유자가 탈퇴를 시도할 경우 ForbiddenError 반환
     * - <404>: 프로젝트가 없거나 해당 프로젝트의 멤버가 아닌 경우 NotFoundError 반환
     * - <409>: 이미 탈퇴 상태인 유저가 중복 탈퇴를 시도할 경우 ConflictError 반환
     * - <500>: 시스템 내부 오류 발생 시 ServerError 반환
     */
    Result LeaveProject(long projectId, long userId);

    /**
     * Action: 검증된 GitHub 저장소 정보를 프로젝트 엔티티에 최종 반영함
     * Input:
     * - long projectId: 업데이트할 프로젝트 ID
     * - long userId: 수정을 시도하는 사용자 ID (소유자 권한 확인용)
     * - long repoId: GitHub에서 제공하는 고유 저장소 번호
     * - String repoFullName: GitHub 저장소 전체 이름 (예: owner/repo)
     * Success:
     * - ok(): 프로젝트 엔티티의 저장소 정보 업데이트 및 DB 반영 완료
     * Auth/Permission:
     * - 프로젝트의 소유자(Owner)인 경우에만 수정 가능 (403)
     * Persistence:
     * - _ProjectRepository를 통해 해당 프로젝트의 repoId 및 repoFullName 필드를 영구 저장
     * Failures:
     * - <403>: 수정을 시도하는 유저가 프로젝트 소유자가 아닌 경우 ForbiddenError
     * - <404>: 존재하지 않는 프로젝트 ID인 경우 NotFoundError
     * - <500>: DB 저장 과정에서 제약 조건 위반 또는 시스템 오류 발생 시 ServerError
     */
    Result<Void> updateProjectRepo(long projectId, long userId, long repoId, String repoFullName);
}
