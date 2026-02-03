package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.enums.MeetingMode;
import com.didit.server.data.entity.enums.MeetingStatus;
import com.didit.server.data.entity.enums.ProjectUserRole;
import com.didit.server.data.repository.*;
import com.didit.server.service.command.BookMeetingCommand;
import com.didit.server.service.service.MeetingService;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.ForbiddenError;
import com.didit.server.share.result.impl.NotFoundError;
import com.didit.server.share.result.impl.ServerError;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class MeetingServiceImpl implements MeetingService {

    private final ProjectRepository projectRepository;
    private final ProjectUserRepository projectUserRepository;
    private final UserRepository userRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingUserRepository meetingUserRepository;

    @Override
    public Result<Long> createMeeting(long projectId, long userId, String title, MeetingMode mode){
        try {
            var project = projectRepository.findById(projectId);
            if (project.isEmpty()){
                return Result.fail(new NotFoundError("projectId", projectId));
            }
            var user = userRepository.findById(userId);
            if (user.isEmpty()){
                return Result.fail(new NotFoundError("userId", userId));
            }

            var projectUser = projectUserRepository.findByProject_IdAndUser_Id(project.get().getId(), user.get().getId());
            if (projectUser.isEmpty() || projectUser.get().getRole() != ProjectUserRole.ADMIN){
                return Result.fail(new ForbiddenError("채널을 생성할 권한이 없습니다."));
            }

            // 1. 회의실 생성 (세션Id, 회의실상태 고려 필요)
            MeetingEntity meeting = MeetingEntity.builder()
                    .project(project.get())
                    .createdBy(user.get())
                    .sessionId(UUID.randomUUID().toString())
                    .title(title)
                    .status(MeetingStatus.RUNNING)
                    .mode(mode)
                    .build();
            return Result.ok(meetingRepository.save(meeting).getId());
        } catch (Exception e) {
            return Result.fail(new ServerError("MeetingEntity", projectId));
        }
    }

    @Override
    public Result<Long> bookMeeting(BookMeetingCommand cmd) {
        var project = projectRepository.findById(cmd.projectId());
        if (project.isEmpty()){
            return Result.fail(new NotFoundError("projectId", cmd.projectId()));
        }
        var user = userRepository.findById(cmd.userId());
        if (user.isEmpty()){
            return Result.fail(new NotFoundError("userId", cmd.userId()));
        }

        var projectUser = projectUserRepository.findByProject_IdAndUser_Id(project.get().getId(), user.get().getId());
        if (projectUser.isEmpty() || projectUser.get().getRole() != ProjectUserRole.ADMIN){
            return Result.fail(new ForbiddenError("채널을 예약할 권한이 없습니다."));
        }

        MeetingEntity meeting = MeetingEntity.builder()
                .project(project.get())
                .createdBy(user.get())
                .sessionId(UUID.randomUUID().toString())
                .title(cmd.title())
                .status(MeetingStatus.SCHEDULED)
                .mode(MeetingMode.VOICE)
                .startedAt(cmd.start())
                .endedAt(cmd.end())
                .build();
        return Result.ok(meetingRepository.save(meeting).getId());
    }

    @Override
    public Result UpdateMeeting(long meetingId, String title, LocalDateTime start, LocalDateTime due) {
        var meeting = meetingRepository.findById(meetingId);
        if (meeting.isEmpty()){
            return Result.fail(new NotFoundError("meetingId", meetingId));
        }

        var entity = meeting.get();
        entity.setTitle(title);
        entity.setStartedAt(start);
        entity.setEndedAt(due);
        meetingRepository.save(entity);
        return Result.ok();
    }

    @Override
    public Result DeleteMeeting(long meetingId) {
        var meeting = meetingRepository.findById(meetingId);
        if (meeting.isEmpty()){
            return Result.fail(new NotFoundError("meetingId", meetingId));
        }

        var entity = meeting.get();
        meetingRepository.delete(entity);
        meetingRepository.flush();
        return Result.ok();
    }

    @Override
    public Result<List<MeetingEntity>> GetMeetingList(long projectId, MeetingStatus status, Long cursor, Pageable pageable){
        try {
            var project = projectRepository.findById(projectId);
            if(project.isEmpty())
                return Result.fail(new NotFoundError("projectId", projectId));

            Long lastId = (cursor != null) ? cursor : 0L;

            Slice<MeetingEntity> slice = meetingRepository.findAllByCursor(projectId, status, lastId, pageable);
            return Result.ok(slice.stream().toList());
        } catch (Exception e) {
            return Result.fail(new ServerError("MeetingList", projectId));
        }
    }

    @Override
    public Result<List<MeetingEntity>> GetMeetingListByDate(long projectId, LocalDateTime start, LocalDateTime end) {
        var project = projectRepository.findById(projectId);
        if(project.isEmpty())
            return Result.fail(new NotFoundError("projectId", projectId));

        var list = meetingRepository.findByProjectIdAndStartedAtBetweenOrderByIdDesc(projectId, start, end);
        return Result.ok(list);
    }

    @Override
    public Result<MeetingEntity> FindMeetingById(long meetingId) {
        var meeting = meetingRepository.findById(meetingId);
        if (meeting.isEmpty()){
            return Result.fail(new NotFoundError("meetingId", meetingId));
        }

        return Result.ok(meeting.get());
    }
}
