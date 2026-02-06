package com.didit.server.data.repository;

import com.didit.server.data.entity.IssueEntity;
import com.didit.server.data.entity.enums.IssueStatus;
import com.didit.server.data.entity.enums.ProjectUserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<IssueEntity, Long> {

    Optional<IssueEntity> findByProject_IdAndGithubIssueId(Long projectId, Long githubIssueId);

    List<IssueEntity> findAllByProject_IdOrderByUpdatedAtDesc(Long projectId);

    List<IssueEntity> findTop5ByProject_IdAndStatusOrderByUpdatedAtDesc(Long projectId, IssueStatus status);

    List<IssueEntity> findAllByProject_Id(Long projectId);

    boolean existsByGithubIssueId(long issueId);

    List<IssueEntity> findAllByProject_IdAndStatus(long projectId, IssueStatus status);

    Optional<IssueEntity> findByGithubIssueId(long id);
}
