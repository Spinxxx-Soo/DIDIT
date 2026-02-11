package com.didit.server.data.repository;

import com.didit.server.data.entity.ProjectEntity;
import com.didit.server.data.entity.ProjectUserEntity;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.entity.enums.ProjectUserStatus;
import lombok.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectUserRepository extends JpaRepository<ProjectUserEntity, Long> {

    List<ProjectUserEntity> findAllByUser_Id(long userid);

    @Query("""
            select pu.project
            from ProjectUserEntity pu
            where pu.user.id = :userid
            and pu.status = 'ACTIVE'
            order by pu.joinedAt asc
            """)
    Slice<ProjectEntity> findProjectsByUser_Id(
            @Param("userid") long userid,
            Pageable pageable
    );

    Optional<ProjectUserEntity> findByProject_IdAndUser_Id(long projectId, long userId);

    List<ProjectUserEntity> findAllByProject_Id(long projectId);

    @Query("""
            select pu.user
            from ProjectUserEntity pu
            where pu.project.id = :projectId
            and pu.status = 'ACTIVE'
            """)
    List<UserEntity> findUsersByProjectId(@Param("projectId") long projectId);

    boolean existsByProject_IdAndUser_Id(long projectId, long userId);

    boolean existsByProject_IdAndUser_IdAndStatus(long projectId, long userId, ProjectUserStatus status);

    @Query("""
            select case when count(pu) > 0 then true else false end
            from ProjectUserEntity pu
            join MeetingEntity mt on mt.project.id = pu.project.id
            where pu.user.id = :userId
            and mt.id = :meetingId
            and pu.status = :status
            """)
    boolean existsByMeeting_IdAndUser_IdAndStatus(
            @Param("meetingId") long meetingId,
            @Param("userId") long userId,
            @Param("status") ProjectUserStatus status
    );

    Optional<ProjectUserEntity> findByProject_IdAndUser_IdAndStatus(long projectId, long userId, ProjectUserStatus status);
}
