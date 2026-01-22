package com.didit.server.data.repository;

import com.didit.server.data.entity.MeetingUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MeetingUserRepository extends JpaRepository<MeetingUserEntity, Long> {

    List<MeetingUserEntity> findAllByMeeting_Id(Long meetingId);

    List<MeetingUserEntity> findAllByUser_Id(Long userId);

    Optional<MeetingUserEntity> findByMeeting_IdAndUser_Id(Long meetingId, Long userId);

    boolean existsByMeeting_IdAndUser_Id(Long meetingId, Long userId);

    void deleteByMeeting_IdAndUser_Id(Long meetingId, Long userId);
}
