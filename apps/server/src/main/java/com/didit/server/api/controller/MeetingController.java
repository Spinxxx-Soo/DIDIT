package com.didit.server.api.controller;

import ch.qos.logback.core.status.Status;
import com.didit.server.api.request.CreateMeetingRequest;
import com.didit.server.api.response.MeetingResponse;
import com.didit.server.api.response.ProjectResponse;
import com.didit.server.api.response.UserResponse;
import com.didit.server.api.security.CustomOAuth2User;
import com.didit.server.data.entity.enums.MeetingStatus;
import com.didit.server.service.service.MeetingService;
import com.didit.server.service.service.ProjectService;
import com.didit.server.share.result.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;

    @PostMapping("/{id}/sessions")
    public ResponseEntity<?> createMeeting(@AuthenticationPrincipal CustomOAuth2User user,
                                           @PathVariable long id,
                                           @RequestBody CreateMeetingRequest request) {
        Result<Long> result = meetingService.createMeeting(
                id,
                user.getId(),
                request.title(),
                request.mode()
        );
        return ResponseEntity.ok(result);
    }

    // [Feature][Meetings] 라운지 회의 조회 API GET /api/v1/projects/{id}/meetings
    @GetMapping("/{projectId}/meetings")
    public ResponseEntity<?> GetAllProjects(@PathVariable long projectId,
                                            @RequestParam(required = false) MeetingStatus status,
                                            @RequestParam(required = false) long cursor,
                                            @PageableDefault(size = 20) Pageable pageable) {

        var result = meetingService.GetMeetingList(projectId, status, cursor, pageable);
        if (result.isFailure()) {
            var err = result.getSingleErrorOrThrow();
            var response = err.getResponse();
            return new ResponseEntity<>(response, response.getStatusCode());
        }

        var entities = result.getOrThrow();

        var response = entities.stream().map(x -> MeetingResponse.builder()
                .id(x.getId())
                .project(ProjectResponse.fromEntity(x.getProject()))
                .createdBy(UserResponse.fromEntity(x.getCreatedBy()))
                .sessionId(x.getSessionId())
                .title(x.getTitle())
                .status(x.getStatus())
                .mode(x.getMode())
                .startedAt(x.getStartedAt())
                .endedAt(x.getEndedAt())
                .createdAt(x.getCreatedAt())
                .updatedAt(x.getUpdatedAt())
                .build()).toList();


        return ResponseEntity.ok(response);
    }
}
