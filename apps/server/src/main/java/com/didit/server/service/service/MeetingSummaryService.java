package com.didit.server.service.service;

import com.didit.server.data.entity.MeetingSummaryEntity;
import com.didit.server.service.command.UpdateSummaryCommand;
import com.didit.server.share.result.Result;

import java.util.List;

public interface MeetingSummaryService {

    Result<MeetingSummaryEntity> FindById(Long summaryId);

    /**
     * Action: 프로젝트내 모든 회의록 조회
     * Input:
     * - long projectId: 회의록이 속할 프로젝트 ID
     * Success:
     * - ok(List<MeetingSummaryEntity>): 등록된 레코드들
     * Persistence:
     * - (조회) 레코드 조회
     * Failures:
     * - <404>: 존재하지 않는 projectId
     */
    Result<List<MeetingSummaryEntity>> FindAllByProject(long projectId);

    /**
     * Action: 회의록 생성
     * Input:
     * - long projectId: 회의록이 속할 프로젝트 ID
     * - long meetingId: 회의록이 속할 채널 ID
     * Success:
     * - ok(Long): 생성된 회의록의 PK(id) 반환
     * Persistence:
     * - (추가) 테이블에 새로운 레코드 생성
     * Failures:
     * - <404>: 존재하지 않는 summaryId
     * - <404>: 존재하지 않는 userId
     */
    Result<Long> CreateSummary(long projectId, long meetingId);

    /**
     * Action: 회의록 수정
     * Input:
     * - long summaryId: 회의록이 속할 프로젝트 ID
     * - long userId: 변경하는 유저 Id
     * - UpdateSummaryCommand cmd: 변경할 내용
     * Success:
     * - ok()
     * Persistence:
     * - (수정) 레코드 수정
     * Failures:
     * - <404>: 존재하지 않는 summaryId
     * - <404>: 존재하지 않는 userId
     * - <403>: 프로젝트에 속한 사용자가 아닙니다.
     */
    Result UpdateSummary(long summaryId, long userId, UpdateSummaryCommand cmd);

    /**
     * Action: 회의록 ai워커가 수정
     * Input:
     * - long summaryId: 회의록이 속할 프로젝트 ID
     * - String title: 수정한 제목
     * - String summary: 변경할 내용
     * Success:
     * - ok()
     * Persistence:
     * - (수정) 레코드 수정
     * Failures:
     * - <404>: 존재하지 않는 summaryId
     */
    Result UpdateSummaryByAi(long summaryId, String title, String summary);

    /**
     * Action: 회의록 삭제
     * Input:
     * - long summaryId: 회의록이 속할 프로젝트 ID
     * Success:
     * - ok()
     * Persistence:
     * - (삭제) 레코드 삭제
     * Failures:
     * - <404>: 존재하지 않는 summaryId
     */
    Result DeleteSummary(long summaryId);
}
