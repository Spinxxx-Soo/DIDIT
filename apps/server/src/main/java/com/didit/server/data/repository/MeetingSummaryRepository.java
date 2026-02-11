package com.didit.server.data.repository;

import com.didit.server.data.entity.MeetingSummaryEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MeetingSummaryRepository extends JpaRepository<MeetingSummaryEntity, Long> {

    // project + meeting + version 조회
    Optional<MeetingSummaryEntity> findByProject_IdAndMeeting_IdAndSummaryVersion(
            Long projectId, Long meetingId, Integer summaryVersion
    );

    // project + meeting의 최신 요약 (버전 큰 것)
    Optional<MeetingSummaryEntity> findFirstByProject_IdAndMeeting_IdOrderBySummaryVersionDesc(
            Long projectId, Long meetingId
    );

    // meeting_id가 NULL인 케이스: project + (meeting is null) + version
    Optional<MeetingSummaryEntity> findByProject_IdAndMeetingIsNullAndSummaryVersion(
            Long projectId, Integer summaryVersion
    );

    // project 단위로 최신부터
    List<MeetingSummaryEntity> findByProject_IdOrderByCreatedAtDesc(Long projectId);

    Slice<MeetingSummaryEntity> findByProject_IdAndPublishedAtIsNotNullOrderByPublishedAtDesc(
            Long projectId,
            Pageable pageable
    );

    // meeting 단위로 버전 내림차순
    List<MeetingSummaryEntity> findByProject_IdAndMeeting_IdOrderBySummaryVersionDesc(
            Long projectId, Long meetingId
    );

    // edited_by 기준
    List<MeetingSummaryEntity> findByEditedBy_Id(Long userId);
}
