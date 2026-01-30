package com.didit.server.data.repository;

import com.didit.server.data.entity.MeetingUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MeetingUserRepository extends JpaRepository<MeetingUserEntity, Long> {

    Optional<MeetingUserEntity> findByMeeting_IdAndUser_Id(Long meetingId, Long userId);

    Optional<MeetingUserEntity> findByToken(String token);

    @Query("""
        select mu
        from MeetingUserEntity mu
        join fetch mu.user
        where mu.token in :tokens
    """)
    List<MeetingUserEntity> findAllByTokenInFetchUser(@Param("tokens") Collection<String> tokens);

    List<MeetingUserEntity> findAllByMeeting_Id(Long meetingId);

    boolean existsByMeeting_IdAndUser_Id(Long meetingId, Long userId);

    long deleteByMeeting_IdAndUser_Id(Long meetingId, Long userId);
}
