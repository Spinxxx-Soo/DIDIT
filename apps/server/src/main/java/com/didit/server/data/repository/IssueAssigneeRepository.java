package com.didit.server.data.repository;

import com.didit.server.data.entity.IssueAssigneeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IssueAssigneeRepository extends JpaRepository<IssueAssigneeEntity, Long> {

    List<IssueAssigneeEntity> findAllByIssue_Id(Long issueId);

    List<IssueAssigneeEntity> findAllByUser_Id(Long userId);

    Optional<IssueAssigneeEntity> findByIssue_IdAndUser_Id(Long issueId, Long userId);

    boolean existsByIssue_IdAndUser_Id(Long issueId, Long userId);

    void deleteByIssue_IdAndUser_Id(Long issueId, Long userId);
}
