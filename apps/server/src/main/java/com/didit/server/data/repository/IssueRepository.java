package com.didit.server.data.repository;

import com.didit.server.data.entity.IssueEntity;
import com.didit.server.data.entity.enums.IssueStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<IssueEntity, Long> {

    Optional<IssueEntity> findByProject_IdAndGithubIssueId(Long projectId, Long githubIssueId);

    List<IssueEntity> findAllByProject_IdOrderByUpdatedAtDesc(Long projectId);

    List<IssueEntity> findAllByProject_IdAndStatusOrderByUpdatedAtDesc(Long projectId, IssueStatus status);
}
