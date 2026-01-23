package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.enums.MeetingMode;
import com.didit.server.data.entity.enums.MeetingStatus;
import com.didit.server.data.repository.MeetingRepository;
import com.didit.server.data.repository.MeetingUserRepository;
import com.didit.server.data.repository.ProjectRepository;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.service.service.MeetingService;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.NotFoundError;
import com.didit.server.share.result.impl.ServerError;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;


@Service
@RequiredArgsConstructor
public class MeetingServiceImpl implements MeetingService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final MeetingRepository meetingRepository;
    private final MeetingUserRepository meetingUserRepository;

    @Override
    public Result<Long> createMeeting(long projectId, long userId, String title, MeetingMode mode){
        try {
            var project = projectRepository.findById(projectId).orElse(null);
            if (project == null){
                return Result.fail(new NotFoundError("projectId", projectId));
            }
            var user = userRepository.findById(userId).orElse(null);
            if (user == null){
                return Result.fail(new NotFoundError("userId", userId));
            }
            // 1. 회의실 생성 (세션Id, 회의실상태 고려 필요)
            MeetingEntity meeting = MeetingEntity.builder()
                    .project(project)
                    .createdBy(user)
                    .sessionId(java.util.UUID.randomUUID().toString())
                    .title(title)
                    .status(MeetingStatus.SCHEDULED)
                    .mode(mode)
                    .build();
            return Result.ok(meetingRepository.save(meeting).getId());
        } catch (Exception e) {
            return Result.fail(new ServerError("MeetingEntity", projectId));
        }
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
    public Result<List<MeetingEntity>> GetMeetingList(long projectId, MeetingStatus status, long cursor, Pageable pageable){
        try {
            var project = projectRepository.findById(projectId);
            if(project.isEmpty())
                return Result.fail(new NotFoundError("projectId", projectId));

            Slice<MeetingEntity> slice = meetingRepository.findAllByCursor(projectId, status, cursor, pageable);
            return Result.ok(slice.stream().toList());
        } catch (Exception e) {
            return Result.fail(new ServerError("MeetingList", projectId));
        }
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
