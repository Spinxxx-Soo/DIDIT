package com.didit.server.service.service.impl;

import com.didit.server.data.entity.MeetingSummaryEntity;
import com.didit.server.data.repository.*;
import com.didit.server.service.command.UpdateSummaryCommand;
import com.didit.server.service.service.MeetingSummaryService;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.ForbiddenError;
import com.didit.server.share.result.impl.NotFoundError;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
@Service
public class MeetingSummaryServiceImpl implements MeetingSummaryService {
    private final MeetingSummaryRepository meetingSummaryRepository;
    private final ProjectRepository projectRepository;
    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;
    private final ProjectUserRepository projectUserRepository;

    @Override
    public Result<MeetingSummaryEntity> FindById(Long summaryId) {
        var findResult = meetingSummaryRepository.findById(summaryId);
        return findResult.map(Result::ok).orElseGet(() -> Result.fail(new NotFoundError("summaryId", summaryId)));
    }

    @Override
    public Result<List<MeetingSummaryEntity>> FindAllByProject(long projectId) {
        var findProjectResult = projectRepository.findById(projectId);
        if (findProjectResult.isEmpty()) {
            return Result.fail(new NotFoundError("projectId", projectId));
        }
        var findResult = meetingSummaryRepository.findByProject_IdOrderByCreatedAtDesc(projectId);
        return Result.ok(findResult);
    }

    @Override
    public Result<Long> CreateSummary(long projectId, long meetingId) {
        var findProjectResult = projectRepository.findById(projectId);
        if (findProjectResult.isEmpty()) {
            return Result.fail(new NotFoundError("projectId", projectId));
        }
        var findMeetingResult = meetingRepository.findById(meetingId);
        if (findMeetingResult.isEmpty()) {
            return Result.fail(new NotFoundError("meetingId", meetingId));
        }
        var now = LocalDateTime.now();
        var entity = MeetingSummaryEntity.builder()
                .title(findMeetingResult.get().getTitle() + " - " + now.toString())
                .project(findProjectResult.get())
                .meeting(findMeetingResult.get())
                .publishedAt(now)
                .generatedAt(now)
                .summaryMd("working in process..")
                .summaryVersion(0)
                .build();

        var saveResult = meetingSummaryRepository.saveAndFlush(entity);
        return Result.ok(saveResult.getId());
    }

    @Override
    public Result UpdateSummary(long summaryId, long userId, UpdateSummaryCommand cmd) {
        var findResult = meetingSummaryRepository.findById(summaryId);
        if (findResult.isEmpty()) {
            return Result.fail(new NotFoundError("summaryId", summaryId));
        }
        var findUserResult = userRepository.findById(userId);
        if (findUserResult.isEmpty()) {
            return Result.fail(new NotFoundError("userId", userId));
        }
        if (!projectUserRepository.existsByProject_IdAndUser_Id(
                findResult.get().getProject().getId(), findUserResult.get().getId())) {
            return Result.fail(new ForbiddenError("프로젝트에 속한 사용자가 아닙니다."));
        }

        var entity = findResult.get();
        if (cmd.title() != null && !cmd.title().isEmpty() && !entity.getTitle().equals(cmd.title())) {
            entity.setTitle(cmd.title());
        }
        if (cmd.summaryMd() != null && !cmd.summaryMd().isEmpty() && !entity.getSummaryMd().equals(cmd.summaryMd())) {
            entity.setSummaryMd(cmd.summaryMd());
        }
        entity.setSummaryVersion(entity.getSummaryVersion() + 1);
        meetingSummaryRepository.saveAndFlush(entity);
        return Result.ok();
    }

    @Override
    public Result UpdateSummaryByAi(long summaryId, String summary) {
        var findResult = meetingSummaryRepository.findById(summaryId);
        if (findResult.isEmpty()) {
            return Result.fail(new NotFoundError("summaryId", summaryId));
        }
        var entity = findResult.get();
        if (summary != null && !summary.isEmpty() && !entity.getSummaryMd().equals(summary)) {
            entity.setSummaryMd(summary);
        }
        entity.setGeneratedAt(LocalDateTime.now());
        meetingSummaryRepository.saveAndFlush(entity);
        return Result.ok();
    }

    @Override
    public Result DeleteSummary(long summaryId) {
        var findResult = meetingSummaryRepository.findById(summaryId);
        if (findResult.isEmpty()) {
            return Result.fail(new NotFoundError("summaryId", summaryId));
        }
        var entity = findResult.get();
        meetingSummaryRepository.deleteById(summaryId);
        meetingSummaryRepository.flush();
        return Result.ok();
    }
}
