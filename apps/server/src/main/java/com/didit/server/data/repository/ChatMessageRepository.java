package com.didit.server.data.repository;

import com.didit.server.data.entity.ChatEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatMessageRepository extends JpaRepository<ChatEntity, Long> {
    @Query("SELECT c FROM ChatEntity c " +
            "WHERE c.projectId = :projectId " +
            "AND c.deletedAt IS NULL " +
            "AND (:lastId IS NULL OR c.id < :lastId) " +
            "ORDER BY c.id DESC")
    Slice<ChatEntity> getMessages(@Param("projectId") Long projectId,
                                @Param("lastId") Long lastId,
                                Pageable pageable);

    @Query("SELECT c FROM ChatEntity c " +
            "WHERE c.projectId = :projectId " +
            "AND c.meetingId IS NULL " +
            "AND c.deletedAt IS NULL AND (:lastId IS NULL OR c.id < :lastId)" +
            "ORDER BY c.id DESC")
    Slice<ChatEntity> getProjectMessages(Long projectId, Long lastId, Pageable pageable);

    @Query("SELECT c FROM ChatEntity c " +
            "WHERE c.meetingId = :meetingId " +
            "AND c.deletedAt IS NULL AND (:lastId IS NULL OR c.id < :lastId) " +
            "ORDER BY c.id DESC")
    Slice<ChatEntity> getMeetingMessages(Long meetingId, Long lastId, Pageable pageable);
}
