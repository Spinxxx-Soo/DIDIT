package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingUserEntity;
import com.didit.server.data.repository.*;
import com.didit.server.service.service.MeetingUserService;
import com.didit.server.share.result.Result;
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
    public Result CreateMeetingUser(Long meetingId, Long userId, String token) {
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

        var entity = MeetingUserEntity.builder()
                .meeting(meeting)
                .user(user)
                .token(token)
                .build();

        _MeetingUserRepository.saveAndFlush(entity);
        return Result.ok();
    }

    @Override
    public Result JoinMeeting(String token) {
        var findMeetingUserResult = _MeetingUserRepository.findByToken(token);
        if (findMeetingUserResult.isEmpty()) {
            return Result.fail(new NotFoundError("token", token));
        }
        var meetingUser = findMeetingUserResult.get();
        meetingUser.setJoinedAt(LocalDateTime.now());
        _MeetingUserRepository.saveAndFlush(meetingUser);
        return Result.ok();
    }

    @Override
    public Result leftMeeting(String token) {
        var findMeetingUserResult = _MeetingUserRepository.findByToken(token);
        if (findMeetingUserResult.isEmpty()) {
            return Result.fail(new NotFoundError("token", token));
        }
        var meetingUser = findMeetingUserResult.get();
        meetingUser.setLeftAt(LocalDateTime.now());
        _MeetingUserRepository.saveAndFlush(meetingUser);
        return Result.ok();
    }

    @Override
    public Result<MeetingUserEntity> findMeetingUserByToken(String token) {
        var findMeetingUserResult = _MeetingUserRepository.findByToken(token);
        return findMeetingUserResult.map(Result::ok).orElseGet(() -> Result.fail(new NotFoundError("token", token)));
    }
}
