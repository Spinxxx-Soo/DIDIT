package com.didit.server.data.repository;

import com.didit.server.data.entity.ProjectRecentEntity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectRecentRepository extends JpaRepository<ProjectRecentEntity, Long> {

    @EntityGraph(attributePaths = {"user", "project"})
    List<ProjectRecentEntity> findTop4ByUser_IdOrderByLastViewedAtDesc(Long userId);

    Optional<ProjectRecentEntity> findByUser_IdAndProject_Id(long userId, long projectId);

    @Modifying
    @Transactional
    @Query(value =
            """
            INSERT INTO project_recents (user_id, project_id, last_viewed_at)
            VALUES (:userId, :projectId, NOW())
            ON DUPLICATE KEY UPDATE last_viewed_at = NOW()
            """, nativeQuery = true)
    void upsertRecentView(@Param("userId") long userId,
                          @Param("projectId") long projectId);
}
