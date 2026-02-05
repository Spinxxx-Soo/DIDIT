package com.didit.server.service.service.impl;

import com.didit.server.data.entity.*;
import com.didit.server.data.entity.enums.ProjectUserRole;
import com.didit.server.data.entity.enums.ProjectUserStatus;
import com.didit.server.data.repository.*;
import com.didit.server.service.command.AddProjectCommand;
import com.didit.server.service.service.ProjectService;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {
    private final ProjectUserRepository _ProjectUserRepository;
    private final UserRepository _UserRepository;
    private final ProjectRepository _ProjectRepository;
    private final ProjectInviteRepository _ProjectInviteRepository;
    private final ProjectRecentRepository _ProjectRecentRepository;

    @Override
    @Transactional(readOnly = true)
    public Result<List<ProjectEntity>> findProjectsByUserId(long userId) {
        var user = _UserRepository.findById(userId);
        if(user.isEmpty()){
            return Result.fail(new NotFoundError("userId", userId));
        }
        var projectUsers = _ProjectUserRepository.findAllByUser_Id(userId);
        var projects = projectUsers.stream()
                .filter(pu -> pu.getProject() != null)
                .filter(pu -> pu.getStatus() != ProjectUserStatus.LEFT)
                .map(ProjectUserEntity::getProject).toList();
        return Result.ok(projects);
    }

    @Override
    public Result AddProjectAdminUser(long userId, long projectId) {
        var user = _UserRepository.findById(userId);
        if(user.isEmpty()){
            return Result.fail(new NotFoundError("userId", userId));
        }
        var project = _ProjectRepository.findById(projectId);
        if(project.isEmpty()){
            return Result.fail(new NotFoundError("projectId", projectId));
        }

        var projectUser = ProjectUserEntity.builder()
                .project(project.get())
                .user(user.get())
                .role(ProjectUserRole.ADMIN)
                .status(ProjectUserStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();

        _ProjectUserRepository.save(projectUser);

        return Result.ok();
    }

    @Override
    public Result AddProject(AddProjectCommand cmd) {
        var user = _UserRepository.findById(cmd.ownerUserId());
        if(user.isEmpty()){
            return Result.fail(new NotFoundError("userId", cmd.ownerUserId()));
        }
        if (cmd.repoFullName() != null && !cmd.repoFullName().isBlank()) {
            if(_ProjectRepository.existsByRepoFullName(cmd.repoFullName())){
                return Result.fail(new ConflictError("이미 등록된 깃허브 repo 입니다."));
            }
        }

        var project = ProjectEntity
                .builder()
                .name(cmd.projectName())
                .owner(user.get())
                .repoFullName(cmd.repoFullName())
                .build();

        _ProjectRepository.save(project);

        var addResult = AddProjectAdminUser(cmd.ownerUserId(), project.getId());
        if(addResult.isFailure()) return Result.fail(addResult.getErrors());

        _ProjectRecentRepository.upsertRecentView(cmd.ownerUserId(), project.getId());

        return Result.ok();
    }

    @Override
    public Result<UUID> AddInviteCode(long userId, long projectId, LocalDateTime expiresAt) {
        var user = _UserRepository.findById(userId);
        if(user.isEmpty()){
            return Result.fail(new NotFoundError("userId", userId));
        }
        var project = _ProjectRepository.findById(projectId);
        if(project.isEmpty()){
            return Result.fail(new NotFoundError("projectId", projectId));
        }
        var projectUser =_ProjectUserRepository.findByProject_IdAndUser_Id(projectId, userId);
        if(projectUser.isEmpty() || !projectUser.get().getRole().equals(ProjectUserRole.ADMIN)){
            return Result.fail(new ForbiddenError("허용 되지 않는 유저입니다."));
        }

        var inviteCode = UUID.randomUUID();
        var entity = ProjectInviteEntity.builder()
                .id(inviteCode.toString())
                .project(project.get())
                .user(user.get())
                .expiresAt(expiresAt)
                .build();

        _ProjectInviteRepository.save(entity);

        return Result.ok(inviteCode);
    }

    @Override
    public Result<ProjectEntity> FindProjectByInviteCode(UUID inviteCode) {
        var invite = _ProjectInviteRepository.findById(inviteCode.toString());
        if(invite.isEmpty()){
            return Result.fail(new NotFoundError("inviteCode", inviteCode));
        }
        if(invite.get().getExpiresAt().isBefore(LocalDateTime.now())){
            return Result.fail(new GoneError("expired inviteCode"));
        }

        return Result.ok(invite.get().getProject());
    }

    @Override
    public Result AddProjectUser(long userId, long projectId) {
        var user = _UserRepository.findById(userId);
        if(user.isEmpty()){
            return Result.fail(new NotFoundError("userId", userId));
        }
        var project = _ProjectRepository.findById(projectId);
        if(project.isEmpty()){
            return Result.fail(new NotFoundError("projectId", projectId));
        }

        var projectUser = _ProjectUserRepository.findByProject_IdAndUser_Id(projectId, userId);
        if(projectUser.isPresent()){
            var entity = projectUser.get();
            if (entity.getStatus() == ProjectUserStatus.ACTIVE) {
                return Result.fail(new ConflictError("이미 존재하는 유저입니다."));
            }

            entity.setStatus(ProjectUserStatus.ACTIVE);
            entity.setRole(ProjectUserRole.MEMBER);
            entity.setJoinedAt(LocalDateTime.now());
            entity.setLeftAt(null);

            _ProjectUserRepository.save(entity);
            return Result.ok();
        }

        var projectUserEntity = ProjectUserEntity.builder()
                .project(project.get())
                .user(user.get())
                .role(ProjectUserRole.MEMBER)
                .status(ProjectUserStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();

        _ProjectUserRepository.save(projectUserEntity);

        return Result.ok();
    }

    @Override
    public Result<List<UserEntity>> FindUsersInProject(long projectId) {
        var project = _ProjectRepository.findById(projectId);
        if(project.isEmpty()){
            return Result.fail(new NotFoundError("projectId", projectId));
        }

        var list = _ProjectUserRepository.findUsersByProjectId(projectId);

        return Result.ok(list);
    }

    @Override
    public Result<ProjectUserEntity> FindProjectUser(long userId, long projectId) {
        var user = _UserRepository.findById(userId);
        if(user.isEmpty()){
            return Result.fail(new NotFoundError("userId", userId));
        }
        var project = _ProjectRepository.findById(projectId);
        if(project.isEmpty()){
            return Result.fail(new NotFoundError("projectId", projectId));
        }
        var projectUser =_ProjectUserRepository.findByProject_IdAndUser_Id(projectId, userId);
        if(projectUser.isEmpty()){
            return Result.fail(new NotFoundError("userId", userId));
        }

        return Result.ok(projectUser.get());
    }

    @Override
    public Result<List<ProjectRecentEntity>> GetRecentProjects(long userId){
        try {
            var user = _UserRepository.findById(userId);
            if (user.isEmpty()){
                return Result.fail(new NotFoundError("userId", userId));
            }
            var list = _ProjectRecentRepository.findTop4ByUser_IdOrderByLastViewedAtDesc(userId);
            return Result.ok(list);
        } catch (Exception e) {
            return Result.fail(new ServerError("ProjectRecentList", userId));
        }
    }

    @Override
    @Transactional
    public void UpdateRecentView(long projectId, long userId){
        _ProjectRecentRepository.upsertRecentView(userId, projectId);
    }

    @Override
    public Result<ProjectEntity> FindProjectById(long projectId){
        try {
            var project = _ProjectRepository.findById(projectId);
            return project.map(Result::ok).orElseGet(() -> Result.fail(new NotFoundError("projectId", projectId)));
        } catch (Exception e) {
            return Result.fail(new ServerError("ProjectDetail", projectId));
        }
    }

    @Override
    @Transactional
    public Result DeleteProject(long projectId, long userId) {
        try {
            var project = _ProjectRepository.findById(projectId);
            if (project.isEmpty()){
                return Result.fail(new NotFoundError("projectId", projectId));
            }
            if (!project.get().getOwner().getId().equals(userId)){
                return Result.fail(new ForbiddenError("프로젝트를 삭제 할 권한이 없습니다."));
            }
            _ProjectRepository.delete(project.get());
            return Result.ok();
        } catch (Exception e) {
            return Result.fail(new ServerError("DeleteProject", projectId));
        }
    }

    @Override
    @Transactional
    public Result LeaveProject(long projectId, long userId){
        try {
            var project = _ProjectRepository.findById(projectId);
            if (project.isEmpty()){
                return Result.fail(new NotFoundError("projectId", projectId));
            }
            if (project.get().getOwner().getId().equals(userId)) {
                return Result.fail(new ForbiddenError("프로젝트 소유자는 나갈 수 없습니다. 소유권을 이전하거나 프로젝트를 삭제하세요."));
            }
            var projectUser = _ProjectUserRepository.findByProject_IdAndUser_Id(projectId, userId);
            if (projectUser.isEmpty()) {
                return Result.fail(new NotFoundError("projectUser", userId));
            }
            if (projectUser.get().getStatus() == ProjectUserStatus.LEFT) {
                return Result.fail(new ConflictError("이미 탈퇴 처리된 유저입니다."));
            }

            var entity = projectUser.get();
            entity.setLeftAt(LocalDateTime.now());
            entity.setStatus(ProjectUserStatus.LEFT);
            _ProjectUserRepository.save(entity);

            return Result.ok();
        } catch (Exception e) {
            return Result.fail(new ServerError("LeaveProject", projectId));
        }
    }

    @Override
    @Transactional
    public Result<Void> updateProjectRepo(long projectId, long userId, long repoId, String repoFullName) {
        var project = _ProjectRepository.findById(projectId).orElse(null);
        if (project == null) {
            return Result.fail(new NotFoundError("projectId", projectId));
        }
        if (!project.getOwner().getId().equals(userId)) {
            return Result.fail(new ForbiddenError("프로젝트 이름을 수정 할 권한이 부족합니다."));
        }

        project.setRepoId(repoId);
        project.setRepoFullName(repoFullName);
        _ProjectRepository.save(project);

        return Result.ok();
    }

    @Override
    @Transactional
    public Result<Void> transferOwnership(long projectId, long userId, long newOwnerId){
        try {
            var project = _ProjectRepository.findById(projectId);
            if (project.isEmpty()){
                return Result.fail(new NotFoundError("projectId", projectId));
            }
            if (!project.get().getOwner().getId().equals(userId)) {
                return Result.fail(new ForbiddenError("프로젝트 소유자가 아니기에 권한이 부족합니다."));
            }
            var newOwnerMembership = _ProjectUserRepository
                    .findByProject_IdAndUser_IdAndStatus(projectId, newOwnerId, ProjectUserStatus.ACTIVE)
                    .orElse(null);
            if (newOwnerMembership == null) {
                return Result.fail(new NotFoundError("새로운 팀장이 될 유저가 프로젝트 멤버가 아닙니다.", newOwnerId));
            }

            var oldOwnerMembership = _ProjectUserRepository
                    .findByProject_IdAndUser_IdAndStatus(projectId, userId, ProjectUserStatus.ACTIVE)
                    .orElseThrow();
            oldOwnerMembership.setRole(ProjectUserRole.MEMBER);

            project.get().setOwner(newOwnerMembership.getUser());
            newOwnerMembership.setRole(ProjectUserRole.ADMIN);

            _ProjectRepository.save(project.get());
            _ProjectUserRepository.save(oldOwnerMembership);
            _ProjectUserRepository.save(newOwnerMembership);

            return Result.ok();
        } catch (Exception e) {
            return Result.fail(new ServerError("TransferOwnership", projectId));
        }
    }

    @Override
    @Transactional
    public Result<Void> updateProjectName(long projectId, long userId, String name){
        var project = _ProjectRepository.findById(projectId);
        if(project.isEmpty()){
            return Result.fail(new NotFoundError("projectId", projectId));
        }
        if (!project.get().getOwner().getId().equals(userId)) {
            return Result.fail(new ForbiddenError("프로젝트 소유자가 아니기에 권한이 부족합니다."));
        }
        var entity = project.get();
        entity.setName(name);
        _ProjectRepository.save(entity);
        return Result.ok();
    }

    @Override
    @Transactional
    public Result<Void> removeParticipant(long projectId, long userId, long ownerId){
        try {
            if (ownerId == userId){
                return Result.fail(new ForbiddenError("본인은 추방시킬 수 없습니다. 팀장 위임 혹은 프로작트 삭제를 권장합니다."));
            }
            var project = _ProjectRepository.findById(projectId);
            if(project.isEmpty()){
                return Result.fail(new NotFoundError("projectId", projectId));
            }
            if (!project.get().getOwner().getId().equals(ownerId)){
                return Result.fail(new ForbiddenError("프로젝트 소유자가 아니기에 권한이 부족합니다."));
            }
            var projectUser = _ProjectUserRepository.findByProject_IdAndUser_IdAndStatus(projectId, userId, ProjectUserStatus.ACTIVE);
            if(projectUser.isEmpty()){
                return Result.fail(new NotFoundError("projectUser", userId));
            }
            projectUser.get().setStatus(ProjectUserStatus.LEFT);
            projectUser.get().setLeftAt(LocalDateTime.now());
            _ProjectUserRepository.save(projectUser.get());
        } catch (Exception e) {
            return Result.fail(new ServerError("RemoveParticipant", projectId));
        }
        return Result.ok();
    }
}
