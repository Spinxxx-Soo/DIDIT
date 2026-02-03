package com.didit.server.api.controller;

import com.didit.server.api.request.AnalyzeIssueRequest;
import com.didit.server.api.request.CreateIssueRequest;
import com.didit.server.api.response.IssueResponse;
import com.didit.server.api.response.ProjectResponse;
import com.didit.server.api.response.UserResponse;
import com.didit.server.api.security.CustomOAuth2User;
import com.didit.server.data.repository.IssueRepository;
import com.didit.server.service.service.IssueService;
import com.didit.server.share.result.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;
    private final IssueRepository issueRepository;

    @GetMapping("/{projectId}/issues/active")
    public ResponseEntity<?> GetActiveIssues(@PathVariable long projectId,
                                             @AuthenticationPrincipal CustomOAuth2User user){
        long userId = user.getId();
        var findIssues = issueService.GetActiveIssues(userId, projectId);
        if (findIssues.isFailure()){
            var err = findIssues.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }
        var issueEntities = findIssues.getOrThrow();
        var result = issueEntities.stream()
                .map(IssueResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{projectId}/issues")
    public ResponseEntity<?> GetAllIssues(@PathVariable long projectId,
                                          @AuthenticationPrincipal CustomOAuth2User user){
        long userId = user.getId();
        var findIssues = issueService.GetAllIssues(userId, projectId);
        if (findIssues.isFailure()) {
            var err = findIssues.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        var entities = findIssues.getOrThrow();
        var responses = entities.stream().map(IssueResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(responses);
    }

    @PostMapping("/{projectId}/issue/analyze")
    public ResponseEntity<?> AnalyzePriority(@PathVariable long projectId,
                                             @AuthenticationPrincipal CustomOAuth2User user,
                                             @RequestBody AnalyzeIssueRequest req){
        long userId = user.getId();
        var findIssue = issueService.AnalyzeIssue(projectId, userId, req.title(),
                req.status(), req.body(), req.assigneeIds());
        if (findIssue.isFailure()){
            var err = findIssue.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }
        return ResponseEntity.ok(findIssue.getValue());
    }

    @PostMapping("/{projectId}/issues")
    public ResponseEntity<?> CreateIssue(@PathVariable long projectId,
                                         @AuthenticationPrincipal CustomOAuth2User user,
                                         @RequestBody CreateIssueRequest req){
        long userId = user.getId();
        var findIssue = issueService.CreateIssue(projectId, userId, req.orgName(), req.repoName(),
                req.title(), req.body(), req.assigneeIds(), req.issueId(), req.issuePriority());
        if (findIssue.isFailure()){
            var err = findIssue.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }
        var issueEntities = findIssue.getOrThrow();
        var result = issueRepository.findById(issueEntities).stream().map(IssueResponse::fromEntity);
        return ResponseEntity.ok(result);
    }
}
