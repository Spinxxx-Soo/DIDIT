package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingUserEntity;
import com.didit.server.data.repository.*;
import com.didit.server.service.service.MeetingUserService;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.ForbiddenError;
import com.didit.server.share.result.impl.NotFoundError;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MeetingUserServiceImpl implements MeetingUserService {
    private final UserRepository _UserRepository;
    private final ProjectUserRepository _ProjectUserRepository;
    private final MeetingUserRepository _MeetingUserRepository;
    private final MeetingRepository _MeetingRepository;


    @Override
    public Result joinMeeting(Long meetingId, Long userId, String token) {
        var findMeetingResult = _MeetingRepository.findById(meetingId);
        if (findMeetingResult.isEmpty()) {
            return Result.fail(new NotFoundError("meetingId", meetingId));
        }
        var findUserResult = _UserRepository.findById(userId);
        if (findUserResult.isEmpty()) {
            return Result.fail(new NotFoundError("userId", userId));
        }

        var meeting = findMeetingResult.get();
        var user = findUserResult.get();

        var findProjectUserResult =
                _ProjectUserRepository.findByProject_IdAndUser_Id(meeting.getProject().getId(), userId);
        if (findProjectUserResult.isEmpty()){
            return Result.fail(new ForbiddenError("프로젝트에 속한 유저가 아닙니다."));
        }

        var findMeetingUserResult =
                _MeetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId);

        var entity = findMeetingUserResult.orElseGet(
                () -> MeetingUserEntity.builder()
                .meeting(meeting)
                .user(user)
                .build());
        entity.setToken(token);
        entity.setJoinedAt(LocalDateTime.now());

        _MeetingUserRepository.save(entity);

        return Result.ok();
    }

    @Override
    public Result leftMeeting(Long meetingId, Long userId) {
        var findMeetingResult = _MeetingRepository.findById(meetingId);
        if (findMeetingResult.isEmpty()) {
            return Result.fail(new NotFoundError("meetingId", meetingId));
        }
        var findUserResult = _UserRepository.findById(userId);
        if (findUserResult.isEmpty()) {
            return Result.fail(new NotFoundError("userId", userId));
        }

        var findMeetingUserResult =
                _MeetingUserRepository.findByMeeting_IdAndUser_Id(meetingId, userId);
        if(findMeetingUserResult.isEmpty()){
            return Result.fail(new NotFoundError("userId", userId));
        }

        var entity = findMeetingUserResult.get();
        entity.setLeftAt(LocalDateTime.now());
        _MeetingUserRepository.save(entity);

        return Result.ok();
    }
}
