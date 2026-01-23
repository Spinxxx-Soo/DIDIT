package com.didit.server.service.service;

import com.didit.server.data.entity.IssueEntity;
import com.didit.server.share.result.Result;

import java.util.List;

public interface IssueService {

    /**
     * Action: 특정 프로젝트 내에서 활성화된(OPEN 상태인) 이슈 목록을 최신 수정순으로 최대 5개 반환함
     * Input:
     * - long projectId: 조회할 프로젝트 ID
     * Success:
     * - ok(List<IssueEntity>): 조건에 부합하는 이슈 엔티티 리스트 (최대 5개)
     * Auth/Permission:
     * - 프로젝트 참여자 또는 공개 프로젝트의 경우 누구나 조회 가능
     * Persistence:
     * - (찾기) issueRepository.findTop5ByProject_IdAndStatusOrderByUpdatedAtDesc 호출
     * Failures:
     * - <404>: 존재하지 않는 projectId인 경우 NotFoundError 반환
     * - <500>: 데이터베이스 조회 중 예외 발생 시 ServerError 반환
     */
    Result<List<IssueEntity>> GetActiveIssues(long projectId);
}
