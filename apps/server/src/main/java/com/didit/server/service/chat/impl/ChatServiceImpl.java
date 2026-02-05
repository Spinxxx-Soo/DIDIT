package com.didit.server.service.chat.impl;

import com.didit.server.data.entity.ChatEntity;
import com.didit.server.data.entity.enums.MessageType;
import com.didit.server.data.entity.enums.ProjectUserStatus;
import com.didit.server.data.repository.ChatMessageRepository;
import com.didit.server.data.repository.MeetingRepository;
import com.didit.server.data.repository.ProjectRepository;
import com.didit.server.data.repository.ProjectUserRepository;
import com.didit.server.service.chat.ChatService;
import com.didit.server.share.event.ChatMessageCreatedEvent;
import com.didit.server.share.event.ChatMessageDeletedEvent;
import com.didit.server.share.event.ChatMessageUpdatedEvent;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.BadRequestError;
import com.didit.server.share.result.impl.ForbiddenError;
import com.didit.server.share.result.impl.NotFoundError;
import com.didit.server.share.result.impl.ServerError;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ApplicationEventPublisher publisher;
    private final ProjectUserRepository projectUserRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MeetingRepository meetingRepository;

    @Override
    @Transactional
    public Result<Void> sendMessage(long channelId, long userId, String content){
        if (content == null || content.isBlank()) {
            return Result.fail(new BadRequestError("content", "채팅 내용이 비어있습니다."));
        }

        var findMeetingResult = meetingRepository.findById(channelId);
        if(findMeetingResult.isEmpty()){
            return Result.fail(new NotFoundError("channelId", channelId));
        }

        var meeting = findMeetingResult.get();
        var projectId = meeting.getProject().getId();

        boolean isMember = projectUserRepository.existsByProject_IdAndUser_IdAndStatus(projectId, userId, ProjectUserStatus.ACTIVE);
        if (!isMember) {
            return Result.fail(new ForbiddenError("해당 채널의 채팅을 참여할 권한이 없습니다."));
        }

        ChatEntity chatEntity = ChatEntity.builder()
                .projectId(projectId)
                .meetingId(meeting.getId())
                .userId(userId)
                .message(content)
                .messageType(MessageType.TEXT)
                .build();

        chatMessageRepository.saveAndFlush(chatEntity);


        publisher.publishEvent(new ChatMessageCreatedEvent(
                meeting.getId(),
                userId,
                content,
                Instant.now().toEpochMilli()
        ));

        return Result.ok();
    }

    @Override
    public Result<List<ChatEntity>> getMessage(long channelId, long userId, Long lastId, Pageable pageable){
        try {
            var findMeetingResult = meetingRepository.findById(channelId);
            if(findMeetingResult.isEmpty()){
                return Result.fail(new NotFoundError("channelId", channelId));
            }

            var meeting = findMeetingResult.get();
            var projectId = meeting.getProject().getId();

            boolean isMember = projectUserRepository.existsByProject_IdAndUser_IdAndStatus(projectId, userId, ProjectUserStatus.ACTIVE);
            if (!isMember) {
                return Result.fail(new ForbiddenError("해당 채널의 채팅을 볼 권한이 없습니다."));
            }

            var findChatResult = chatMessageRepository.getMeetingMessages(meeting.getId(), lastId, pageable);
            return Result.ok(findChatResult.stream().toList());
        } catch (Exception e) {
            return Result.fail(new ServerError("ChatList", channelId));
        }
    }

    @Override
    @Transactional
    public Result<Void> updateMessage(long userId, long chatId, String content){
        try {
            ChatEntity chat = chatMessageRepository.findById(chatId)
                    .orElse(null);
            if (chat == null) {
                return Result.fail(new NotFoundError("chatId", chatId));
            }
            if (chat.getUserId() != userId) {
                return Result.fail(new ForbiddenError("자신의 메시지만 수정할 수 있습니다."));
            }
            if (content == null || content.isBlank()) {
                return Result.fail(new BadRequestError("content", "수정할 내용이 없습니다."));
            }

            chat.setMessage(content);
            chat.setEditedAt(LocalDateTime.now());
            chatMessageRepository.saveAndFlush(chat);

            publisher.publishEvent(new ChatMessageUpdatedEvent(
                    chat.getMeetingId(),
                    chat.getId(),
                    chat.getMessage(),
                    chat.getEditedAt()
            ));
            return Result.ok();
        } catch (RuntimeException e) {
            return Result.fail(new ServerError("UpdateMessage", chatId));
        }
    }

    @Override
    @Transactional
    public Result<Void> deleteMessage(long chatId, long userId){
        try {
            ChatEntity chat = chatMessageRepository.findById(chatId)
                    .orElse(null);
            if (chat == null) {
                return Result.fail(new NotFoundError("chatId", chatId));
            }
            if(chat.getUserId() != userId){
                return Result.fail(new ForbiddenError("자신의 메시지만 삭제할 수 있습니다."));
            }
            chat.setDeletedAt(LocalDateTime.now());
            chatMessageRepository.delete(chat);
            chatMessageRepository.flush();

            publisher.publishEvent(new ChatMessageDeletedEvent(
                    chat.getMeetingId(),
                    chat.getId(),
                    chat.getMessage()
            ));
            return Result.ok();
        } catch (RuntimeException e) {
            return Result.fail(new ServerError("DeleteMessage", chatId));
        }
    }

    @Override
    public boolean checkMembership(long channelId, long userId) {
        Long projectId = channelId;

        var meeting = meetingRepository.findById(channelId);
        if (meeting.isPresent()) {
            projectId = meeting.get().getProject().getId();
        }

        return projectUserRepository.existsByProject_IdAndUser_IdAndStatus(projectId, userId, ProjectUserStatus.ACTIVE);
    }

    @Override
    public boolean checkMembershipInProject(long projectId, long userId) {
        return projectUserRepository.existsByProject_IdAndUser_IdAndStatus(projectId, userId, ProjectUserStatus.ACTIVE);
    }
}
