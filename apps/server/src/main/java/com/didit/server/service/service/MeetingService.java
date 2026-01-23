package com.didit.server.service.service;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.enums.MeetingMode;
import com.didit.server.data.entity.enums.MeetingStatus;
import com.didit.server.share.result.Result;
import org.springframework.data.domain.Pageable;

import java.util.List;

import java.time.LocalDateTime;

public interface MeetingService {

    /**
     * Action: 프로젝트 내에 새로운 회의실(Session)을 생성한다.
     * Input:
     * - long projectId: 회의가 속할 프로젝트 ID
     * - long userId: 생성자 ID (SecurityContext에서 추출)
     * - String title: 회의 제목 (최대 50자)
     * - MeetingMode mode: 회의 모드 (VOICE 또는 CHAT)
     * Success:
     * - ok(Long): 생성된 회의실의 PK(id) 반환
     * Auth/Permission:
     * - (로그인 필요 / 해당 프로젝트의 멤버여야 함)
     * Persistence:
     * - (추가) meetings 테이블에 새로운 레코드 생성
     * Failures:
     * - <404>: 존재하지 않는 projectId
     * - <403>: 해당 프로젝트에 생성 권한이 없는 사용자
     * - <400>: 제목(title)이 누락되었거나 길이 제한(50자)을 초과한 경우
     * - <500>: 데이터베이스 저장 중 예상치 못한 런타임 예외 발생
     */
    Result<Long> createMeeting(long projectId, long userId, String title, MeetingMode mode);

    /**
     * Action: 프로젝트 내에 회의실의 이름, 시작시간, 종료시간을 변경한다.
     * Input:
     * - long meetingId: 회의실 Id
     * - String title: 수정할 제목
     * - LocalDateTime start : 수정할 시작시간
     * - LocalDateTime due: 수정할 종료시간
     * Success:
     * - ok()
     * Auth/Permission:
     * - (어드민)
     * Persistence:
     * - (변경)
     * Failures:
     * - <404>: 존재하지 않는 meetingId - resource = meetingId
     */
    Result UpdateMeeting(long meetingId, String title, LocalDateTime start, LocalDateTime due);

    /**
     * Action: 프로젝트 내에 회의실을 삭제.
     * Input:
     * - long meetingId: 회의실 Id
     * Success:
     * - ok()
     * Auth/Permission:
     * - (로그인 필요 / 해당 프로젝트의 멤버여야 함)
     * Persistence:
     * - (삭제)
     * Failures:
     * - <404>: 존재하지 않는 meetingId - resource = meetingId
     */
    Result DeleteMeeting(long meetingId);


    /**
     * Action: 회의실을 회의실ID로 찾음
     * Input:
     * - long meetingId: 회의실 Id
     * Success:
     * - ok()
     * Auth/Permission:
     * - (로그인 필요 / 해당 프로젝트의 멤버여야 함)
     * Persistence:
     * - (삭제)
     * Failures:
     * - <404>: 존재하지 않는 meetingId - resource = meetingId
     */
    Result<MeetingEntity> FindMeetingById(long meetingId);
    /**
     * Action: 특정 프로젝트 내의 회의를 커서 기반 페이지네이션으로 반환함
     * Input:
     * - long projectId: 조회할 프로젝트 ID
     * - long cursor: 직전 페이지의 마지막 아이템 ID (첫 페이지는 0)
     * - Pageable pageable: 한 페이지 사이즈 및 정렬 규격
     * Success:
     * - ok(Slice<MeetingEntity>)
     * Auth/Permission:
     * - (누구나 또는 프로젝트 참여자)
     * Persistence:
     * - (찾기)
     * Failures:
     * - <404>: 존재하지 않는 projectId
     */
    Result<List<MeetingEntity>> GetMeetingList(long projectId, MeetingStatus status, long cursor, Pageable pageable);
}
