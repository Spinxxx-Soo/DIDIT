package com.didit.server.service.service.impl;

import com.didit.server.data.entity.IssueEntity;
import com.didit.server.data.entity.enums.IssueStatus;
import com.didit.server.data.repository.IssueRepository;
import com.didit.server.data.repository.ProjectRepository;
import com.didit.server.service.service.IssueService;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.NotFoundError;
import com.didit.server.share.result.impl.ServerError;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;

    @Override
    public Result<List<IssueEntity>> GetActiveIssues(long projectId) {
        try {
            var project = projectRepository.findById(projectId);
            if(project.isEmpty()){
                return Result.fail(new NotFoundError("projectId", projectId));
            }
            var list = issueRepository.findTop5ByProject_IdAndStatusOrderByUpdatedAtDesc(projectId, IssueStatus.OPEN);
            return Result.ok(list);
        }catch (Exception e) {
            return Result.fail(new ServerError("IssueList", projectId));
        }
    }
}
