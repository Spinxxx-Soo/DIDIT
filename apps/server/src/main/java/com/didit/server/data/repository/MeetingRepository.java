package com.didit.server.data.repository;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.enums.MeetingStatus;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MeetingRepository extends JpaRepository<MeetingEntity, Long> {

    @Query("SELECT m FROM MeetingEntity m " +
            "WHERE m.project.id = :projectId " +
            "AND (:status IS NULL OR m.status = :status) " +
            "AND (:cursor = 0L OR m.id < :cursor) " +
            "ORDER BY m.id DESC")
    Slice<MeetingEntity> findAllByCursor(
            @Param("projectId") long projectId,
            @Param("status") MeetingStatus status,
            @Param("cursor") long cursor,
            Pageable pageable);
}
