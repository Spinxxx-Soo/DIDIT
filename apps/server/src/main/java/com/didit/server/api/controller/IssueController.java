package com.didit.server.api.controller;

import com.didit.server.api.response.IssueResponse;
import com.didit.server.api.response.ProjectResponse;
import com.didit.server.api.response.UserResponse;
import com.didit.server.service.service.IssueService;
import com.didit.server.share.result.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @GetMapping("projects/{projectId}/issues/active")
    public ResponseEntity<?> GetActiveIssues(@PathVariable long projectId){
        var findIssues = issueService.GetActiveIssues(projectId);
        if(findIssues.isFailure()){
            var err = findIssues.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }
        var issueEntities = findIssues.getOrThrow();
        var result = issueEntities.stream()
                .map(IssueResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(result);
    }
}
