package com.didit.server.api.controller;

import ch.qos.logback.core.status.Status;
import com.didit.server.api.response.MeetingResponse;
import com.didit.server.api.response.MeetingResponse;
import com.didit.server.api.response.ProjectResponse;
import com.didit.server.api.response.UserResponse;
import com.didit.server.api.security.CustomOAuth2User;
import com.didit.server.data.entity.enums.MeetingStatus;
import com.didit.server.service.service.MeetingService;
import com.didit.server.service.service.ProjectService;
import com.didit.server.service.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/channels/")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService _meetingService;
    private final ProjectService _projectService;


    //이름 수정: PATCH /api/v1/meetings/{sId}
    @PatchMapping("/{channelId}")
    public ResponseEntity<?> updateMeeting(@AuthenticationPrincipal CustomOAuth2User user,
                                           @PathVariable Long channelId,
                                           @RequestParam(required = false) String title,
                                           @RequestParam(required = false) LocalDateTime start,
                                           @RequestParam(required = false) LocalDateTime due) {
        var findMeetingResult = _meetingService.FindMeetingById(channelId);
        if (findMeetingResult.isFailure()) {
            var err = findMeetingResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }
        var meetingEntity = findMeetingResult.getOrThrow();
        title = title == null ? meetingEntity.getTitle() : title;
        start = start == null ? meetingEntity.getStartedAt() : start;
        due = due == null ? meetingEntity.getEndedAt() : due;

        var findResult = _projectService.FindProjectUser(user.getId(), meetingEntity.getProject().getId());
        if (findResult.isFailure()) {
            var err = findResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        var updateResult = _meetingService.UpdateMeeting(channelId, title, start, due);
        if (updateResult.isFailure()) {
            var err = updateResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        return ResponseEntity.ok().build();
    }

    //삭제: DELETE /api/v1/meetings/{sId} Z
    @DeleteMapping("/{channelId}")
    public ResponseEntity<?> deleteMeeting(@AuthenticationPrincipal CustomOAuth2User user,
                                           @PathVariable Long channelId) {
        var findMeetingResult = _meetingService.FindMeetingById(channelId);
        if (findMeetingResult.isFailure()) {
            var err = findMeetingResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }
        var projectId = findMeetingResult.getValue().get().getProject().getId();
        var findResult = _projectService.FindProjectUser(user.getId(), projectId);
        if (findResult.isFailure()) {
            var err = findResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        var deleteResult = _meetingService.DeleteMeeting(channelId);
        if (deleteResult.isFailure()) {
            var err = deleteResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        return ResponseEntity.ok().build();
    }

    @GetMapping("/{channelId}")
    public ResponseEntity<?> findMeeting(@AuthenticationPrincipal CustomOAuth2User user,
                                         @PathVariable Long channelId) {
        var findMeetingResult = _meetingService.FindMeetingById(channelId);
        if (findMeetingResult.isFailure()) {
            var err = findMeetingResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }
        var meetingEntity = findMeetingResult.getOrThrow();
        var findResult = _projectService.FindProjectUser(user.getId(), meetingEntity.getProject().getId());
        if (findResult.isFailure()) {
            var err = findResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }
        var res = MeetingResponse.builder()
                .id(meetingEntity.getId())
                .project(ProjectResponse.fromEntity(meetingEntity.getProject()))
                .createdBy(UserResponse.fromEntity(meetingEntity.getCreatedBy()))
                .sessionId(meetingEntity.getSessionId())
                .title(meetingEntity.getTitle())
                .status(meetingEntity.getStatus())
                .mode(meetingEntity.getMode())
                .startedAt(meetingEntity.getStartedAt())
                .endedAt(meetingEntity.getEndedAt())
                .createdAt(meetingEntity.getCreatedAt())
                .updatedAt(meetingEntity.getUpdatedAt())
                .build();
        return ResponseEntity.ok(res);
    }


}
