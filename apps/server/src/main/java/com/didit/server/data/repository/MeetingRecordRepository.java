package com.didit.server.data.repository;

import com.didit.server.data.entity.MeetingRecordEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MeetingRecordRepository extends JpaRepository<MeetingRecordEntity, Long> {

    // 단건 조회
    Optional<MeetingRecordEntity> findByRecordingSessionId(String recordingSessionId);

    boolean existsByRecordingSessionId(String recordingSessionId);

    // meeting 기준
    List<MeetingRecordEntity> findAllByMeeting_IdOrderByStartAtDesc(Long meetingId);

    // 최근 N개 (Pageable로 limit)
    List<MeetingRecordEntity> findAllByMeeting_IdOrderByCreatedAtDesc(Long meetingId, Pageable pageable);

    // 미종료(녹화중) 기록들
    List<MeetingRecordEntity> findAllByMeeting_IdAndEndAtIsNullOrderByStartAtDesc(Long meetingId);

    // createdBy 기준
    List<MeetingRecordEntity> findAllByCreatedBy_IdOrderByCreatedAtDesc(Long userId);

    // 기간 필터
    @Query("""
        select r
        from MeetingRecordEntity r
        where r.meeting.id = :meetingId
          and r.startAt >= :from
          and r.startAt < :to
        order by r.startAt desc
    """)
    List<MeetingRecordEntity> findAllByMeetingIdAndStartAtBetween(
            Long meetingId,
            LocalDateTime from,
            LocalDateTime to
    );

    // meeting + user 기준 (이 사용자가 만든 기록)
    List<MeetingRecordEntity> findAllByMeeting_IdAndCreatedBy_IdOrderByCreatedAtDesc(Long meetingId, Long userId);

    // 현재 녹화중인 것(있다면 1개라고 가정할 때)
    Optional<MeetingRecordEntity> findTop1ByMeeting_IdAndEndAtIsNullOrderByStartAtDesc(Long meetingId);
}
