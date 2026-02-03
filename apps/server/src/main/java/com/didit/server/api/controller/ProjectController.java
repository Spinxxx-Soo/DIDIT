package com.didit.server.api.controller;

import com.didit.server.api.request.AddProjectInviteRequest;
import com.didit.server.api.request.AddProjectRequest;
import com.didit.server.api.request.BookMeetingRequest;
import com.didit.server.api.request.CreateMeetingRequest;
import com.didit.server.api.response.MeetingResponse;
import com.didit.server.api.response.ProjectRecentResponse;
import com.didit.server.api.response.ProjectResponse;
import com.didit.server.api.response.UserResponse;
import com.didit.server.api.security.CustomOAuth2User;
import com.didit.server.data.entity.ProjectEntity;
import com.didit.server.data.entity.enums.MeetingStatus;
import com.didit.server.service.command.AddProjectCommand;
import com.didit.server.service.command.BookMeetingCommand;
import com.didit.server.service.service.MeetingService;
import com.didit.server.service.service.ProjectService;
import com.didit.server.share.result.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.awt.print.Book;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectService _ProjectService;
    private final MeetingService _MeetingService;

    //[Feature][Rooms] 방 목록 조회 + 사이드바 연동 (GET /api/v1/rooms)
    @GetMapping()
    public ResponseEntity<?> findProjects(@AuthenticationPrincipal CustomOAuth2User user) {
        var userId = user.getId();

        var findResult = _ProjectService.findProjectsByUserId(userId);
        if (findResult.isFailure()) {
            var err = findResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        var entities = findResult.getOrThrow();
        var responses = entities.stream().map(ProjectResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(responses);
    }

    //[Feature][Rooms] 방 생성 + 생성 즉시 목록 반영 (POST /api/v1/rooms) #5
    @PostMapping()
    public ResponseEntity<?> AddProject(@AuthenticationPrincipal CustomOAuth2User user,
                                        @RequestBody @Valid AddProjectRequest request) {
        var userId = user.getId();

        var addResult = _ProjectService.AddProject(new AddProjectCommand(userId, request.projectName(), request.githubUrl()));
        if (addResult.isFailure()) {
            var err = addResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        return ResponseEntity.ok().build();
    }

    //[Feature][Invites] 초대 코드/링크 생성 (POST /api/v1/projects/{id}/invites)
    @PostMapping("/invites")
    public ResponseEntity<?> AddInvite(@AuthenticationPrincipal CustomOAuth2User user,
                                       @RequestBody @Valid AddProjectInviteRequest request) {
        var userId = user.getId();
        var expire = request.expireDate() == null ? LocalDateTime.now().plusYears(1000) : request.expireDate();
        var addResult = _ProjectService.AddInviteCode(userId, request.projectId(), expire);
        if (addResult.isFailure()) {
            var err = addResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        return ResponseEntity.ok(addResult.getValue());
    }

    //[Feature][Join] 초대 코드로 방 참여 (POST /api/v1/rooms/projects/{inviteCode})
    @GetMapping("/invites/{inviteCode}")
    public ResponseEntity<?> GetProjectByInviteCode(@PathVariable String inviteCode) {
        UUID uuid;
        try {
            uuid = UUID.fromString(inviteCode);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().build();
        }
        var findResult = _ProjectService.FindProjectByInviteCode(uuid);
        if (findResult.isFailure()) {
            var err = findResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }
        var entity = findResult.getValue().get();
        return ResponseEntity.ok(ProjectResponse.fromEntity(entity));
    }

    @PostMapping("invites/{inviteCode}")
    public ResponseEntity<?> AddProjectUserByInviteCode(@AuthenticationPrincipal CustomOAuth2User user,
                                                        @PathVariable String inviteCode) {
        UUID uuid;
        try {
            uuid = UUID.fromString(inviteCode);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().build();
        }

        var findResult = _ProjectService.FindProjectByInviteCode(uuid);
        if (findResult.isFailure()) {
            var err = findResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        var userId = user.getId();
        var entity = findResult.getValue().get();

        var addResult = _ProjectService.AddProjectUser(userId, entity.getId());
        if (addResult.isFailure()) {
            var err = addResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        return ResponseEntity.ok().build();
    }

    //[Feature][Participants] 방 참여자 목록 조회 (GET /api/v1/projects/{id}/participants) #8
    @GetMapping("/{projectId}/participants")
    public ResponseEntity<?> findUsersInProject(@PathVariable Long projectId) {
        var findResult = _ProjectService.FindUsersInProject(projectId);
        if (findResult.isFailure()) {
            var err = findResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        var entities = findResult.getOrThrow();
        var response = entities.stream().map(x -> UserResponse.builder()
                .id(x.getId())
                .githubId(x.getGithubId())
                .githubLogin(x.getGithubLogin())
                .name(x.getName())
                .avatarUrl(x.getAvatarUrl())
                .createdAt(x.getCreatedAt())
                .lastLoginAt(x.getLastLoginAt())
                .build()).toList();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{projectId}/add-channel")
    public ResponseEntity<?> createMeeting(@AuthenticationPrincipal CustomOAuth2User user,
                                           @PathVariable Long projectId,
                                           @RequestBody @Valid CreateMeetingRequest request) {
        Result<Long> result = _MeetingService.createMeeting(
                projectId,
                user.getId(),
                request.title(),
                request.mode()
        );
        if (result.isFailure()) {
            var err = result.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        return ResponseEntity.ok(result.getOrThrow());
    }

    @PostMapping("/{projectId}/book-channel")
    public ResponseEntity<?> bookMeeting(@AuthenticationPrincipal CustomOAuth2User user,
                                         @PathVariable Long projectId,
                                         @RequestBody @Valid BookMeetingRequest request) {
        if (request.start().isAfter(request.end())) {
            return ResponseEntity.badRequest().build();
        }

        var cmd = new BookMeetingCommand(projectId, user.getId(), request.title(), request.start(), request.end());
        Result<Long> result = _MeetingService.bookMeeting(
                cmd
        );
        if (result.isFailure()) {
            var err = result.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        return ResponseEntity.ok(result.getOrThrow());
    }

    // [Feature][Meetings] 라운지 회의 조회 API GET /api/v1/projects/{id}/meetings
    @GetMapping("/{projectId}/channels")
    public ResponseEntity<?> GetAllMeetings(@PathVariable Long projectId,
                                            @RequestParam(required = false) MeetingStatus status,
                                            @RequestParam(required = false) Long cursor,
                                            @PageableDefault(size = 20) Pageable pageable) {

        var result = _MeetingService.GetMeetingList(projectId, status, cursor, pageable);
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

    @GetMapping("/{projectId}/channels/date")
    public ResponseEntity<?> GetAllMeetingsByDate(
            @AuthenticationPrincipal CustomOAuth2User user,
            @PathVariable Long projectId,
            @RequestParam(required = true) LocalDateTime start,
            @RequestParam(required = true) LocalDateTime end) {

        var userId = user.getId();
        var userFindResult = _ProjectService.FindProjectUser(userId, projectId);
        if (userFindResult.isFailure()){
            var err = userFindResult.getSingleErrorOrThrow();
            var response = err.getResponse();
            return new ResponseEntity<>(response, response.getStatusCode());
        }

        var result = _MeetingService.GetMeetingListByDate(projectId, start, end);
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

    @GetMapping("/recents")
    public ResponseEntity<?> GetRecentProjects(@AuthenticationPrincipal CustomOAuth2User user) {
        var userId = user.getId();
        var recentProjects = _ProjectService.GetRecentProjects(userId);
        if (recentProjects.isFailure()) {
            var err = recentProjects.getSingleErrorOrThrow();
            var response = err.getResponse();
            return new ResponseEntity<>(response, response.getStatusCode());
        }
        var projectsEntities = recentProjects.getOrThrow();
        var result = projectsEntities.stream()
                .map(ProjectRecentResponse::fromEntity).toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<?> GetProjectDetail(@PathVariable long projectId,
                                              @AuthenticationPrincipal CustomOAuth2User user) {
        var userId = user.getId();
        var findUser = _ProjectService.FindProjectUser(userId, projectId);
        if (findUser.isFailure()) {
            var err = findUser.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }
        var findResult = _ProjectService.FindProjectById(projectId);
        if (findResult.isFailure()) {
            var err = findResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }

        _ProjectService.UpdateRecentView(projectId, userId);
        var entity = (ProjectEntity) findResult.getOrThrow();
        return ResponseEntity.ok(ProjectResponse.fromEntity(entity));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> DeleteProject(@PathVariable long projectId,
                                           @AuthenticationPrincipal CustomOAuth2User user){
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{projectId}/leave")
    public ResponseEntity<?> leaveProject(@PathVariable long projectId,
                                          @AuthenticationPrincipal CustomOAuth2User user) {
        return ResponseEntity.ok().build();
    }
}
