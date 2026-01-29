package com.didit.server.service.chat.impl;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

import com.didit.server.data.entity.ChatEntity;
import com.didit.server.data.entity.MeetingEntity;
import com.didit.server.data.entity.ProjectEntity;
import com.didit.server.data.repository.ChatMessageRepository;
import com.didit.server.data.repository.MeetingRepository;
import com.didit.server.data.repository.ProjectRepository;
import com.didit.server.data.repository.ProjectUserRepository;
import com.didit.server.service.chat.event.ChatMessageCreatedEvent;

import java.util.List;
import java.util.Optional;

import com.didit.server.service.chat.event.ChatMessageDeletedEvent;
import com.didit.server.service.chat.event.ChatMessageUpdatedEvent;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.BadRequestError;
import com.didit.server.share.result.impl.ForbiddenError;
import com.didit.server.share.result.impl.NotFoundError;
import com.didit.server.share.result.impl.ServerError;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

@ExtendWith(MockitoExtension.class)
class ChatServiceImplTest {

    @InjectMocks
    private ChatServiceImpl chatService;

    @Mock
    private ProjectUserRepository projectUserRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ApplicationEventPublisher publisher;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private MeetingRepository meetingRepository;


    @Test
    @DisplayName("성공: 프로젝트 채널에서 메시지를 저장하고 이벤트를 발행한다.")
    void sendMessage_Success_Project() {
        // Given
        long channelId = 1L;
        long userId = 10L;
        String content = "안녕하세요!";

        given(meetingRepository.findById(channelId)).willReturn(Optional.empty()); // 미팅 아님
        given(projectUserRepository.existsByProject_IdAndUser_Id(channelId, userId)).willReturn(true);

        // When
        Result<Void> result = chatService.sendMessage(channelId, userId, content);

        // Then
        assertThat(result.isSuccess()).isTrue();
        then(chatMessageRepository).should(times(1)).save(any(ChatEntity.class));
        then(publisher).should(times(1)).publishEvent(any(ChatMessageCreatedEvent.class));
    }

    @Test
    @DisplayName("실패 <400>: 채팅 내용이 비어있으면 BadRequestError를 반환한다.")
    void sendMessage_Fail_EmptyContent() {
        // Given
        long channelId = 1L;
        long userId = 10L;
        String content = "   ";

        // When
        Result<Void> result = chatService.sendMessage(channelId, userId, content);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(BadRequestError.class);
    }

    @Test
    @DisplayName("실패 <403>: 권한이 없으면 ForbiddenError를 반환한다.")
    void sendMessage_Fail_Forbidden() {
        // Given
        long channelId = 1L;
        long userId = 10L;
        given(meetingRepository.findById(channelId)).willReturn(Optional.empty());
        given(projectUserRepository.existsByProject_IdAndUser_Id(channelId, userId)).willReturn(false);

        // When
        Result<Void> result = chatService.sendMessage(channelId, userId, "내용");

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ForbiddenError.class);
    }

    @Test
    @DisplayName("성공: 프로젝트 채널 최초 조회 시 최신 메시지 목록을 반환한다.")
    void getMessage_Success_FirstLoad() {
        // Given
        long channelId = 1L;
        long userId = 10L;
        Long lastId = null;
        Pageable pageable = PageRequest.of(0, 20);
        List<ChatEntity> chats = List.of(mock(ChatEntity.class), mock(ChatEntity.class));
        Slice<ChatEntity> slice = new SliceImpl<>(chats);

        // ID 해석 및 권한 체크 모킹
        given(meetingRepository.findById(channelId)).willReturn(Optional.empty()); // 미팅 아님
        given(projectUserRepository.existsByProject_IdAndUser_Id(channelId, userId)).willReturn(true); // 멤버임
        given(projectRepository.existsById(channelId)).willReturn(true); // 프로젝트 존재함

        // 프로젝트 전용 쿼리 호출 모킹
        given(chatMessageRepository.getProjectMessages(channelId, lastId, pageable)).willReturn(slice);

        // When
        Result<List<ChatEntity>> result = chatService.getMessage(channelId, userId, lastId, pageable);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getOrThrow()).hasSize(2);
        then(chatMessageRepository).should(times(1)).getProjectMessages(channelId, lastId, pageable);
    }

    @Test
    @DisplayName("성공: 미팅 채널 조회 시 미팅 전용 쿼리를 통해 메시지 목록을 반환한다.")
    void getMessage_Success_Meeting() {
        // Given
        long meetingId = 50L;
        long projectId = 1L;
        long userId = 10L;
        Long lastId = 100L;
        Pageable pageable = PageRequest.of(0, 20);

        // 미팅 정보 모킹
        ProjectEntity project = mock(ProjectEntity.class);
        given(project.getId()).willReturn(projectId);
        MeetingEntity meeting = mock(MeetingEntity.class);
        given(meeting.getProject()).willReturn(project);

        given(meetingRepository.findById(meetingId)).willReturn(Optional.of(meeting));
        given(projectUserRepository.existsByProject_IdAndUser_Id(projectId, userId)).willReturn(true);
        given(projectRepository.existsById(projectId)).willReturn(true);
        given(chatMessageRepository.getMeetingMessages(meetingId, lastId, pageable))
                .willReturn(new SliceImpl<>(List.of(mock(ChatEntity.class))));

        // When
        Result<List<ChatEntity>> result = chatService.getMessage(meetingId, userId, lastId, pageable);

        // Then
        assertThat(result.isSuccess()).isTrue();
        then(chatMessageRepository).should(times(1)).getMeetingMessages(meetingId, lastId, pageable);
    }

    @Test
    @DisplayName("실패 <403>: 채널 멤버가 아닌 경우 ForbiddenError를 반환한다.")
    void getMessage_Fail_Forbidden() {
        // Given
        long channelId = 1L;
        long userId = 999L; // 권한 없는 유저
        given(meetingRepository.findById(channelId)).willReturn(Optional.empty());
        given(projectUserRepository.existsByProject_IdAndUser_Id(channelId, userId)).willReturn(false);

        // When
        Result<List<ChatEntity>> result = chatService.getMessage(channelId, userId, null, PageRequest.of(0, 20));

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ForbiddenError.class);
        then(chatMessageRepository).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("실패 <404>: 존재하지 않는 프로젝트 ID인 경우 NotFoundError를 반환한다.")
    void getMessage_Fail_NotFound() {
        // Given
        long channelId = 1L;
        long userId = 10L;
        given(meetingRepository.findById(channelId)).willReturn(Optional.empty());
        given(projectUserRepository.existsByProject_IdAndUser_Id(channelId, userId)).willReturn(true);
        given(projectRepository.existsById(channelId)).willReturn(false); // 프로젝트 없음

        // When
        Result<List<ChatEntity>> result = chatService.getMessage(channelId, userId, null, PageRequest.of(0, 20));

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(NotFoundError.class);
    }

    @Test
    @DisplayName("실패 <500>: DB 조회 중 예외가 발생하면 ServerError를 반환한다.")
    void getMessage_Fail_ServerError() {
        // Given
        long channelId = 1L;
        long userId = 10L;
        given(meetingRepository.findById(channelId)).willReturn(Optional.empty());
        given(projectUserRepository.existsByProject_IdAndUser_Id(channelId, userId)).willReturn(true);
        given(projectRepository.existsById(channelId)).willReturn(true);

        // 의도적으로 예외 발생시키기
        given(chatMessageRepository.getProjectMessages(anyLong(), any(), any()))
                .willThrow(new RuntimeException("DB 연결 실패"));

        // When
        Result<List<ChatEntity>> result = chatService.getMessage(channelId, userId, null, PageRequest.of(0, 20));

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ServerError.class); // 500 에러 객체인지 확인
    }

    @Test
    @DisplayName("성공: 작성자 본인이 유효한 내용을 입력하면 메시지를 수정하고 이벤트를 발행한다.")
    void updateMessage_Success() {
        // Given
        long userId = 10L;
        long chatId = 100L;
        String newContent = "수정된 내용입니다.";

        ChatEntity chat = spy(ChatEntity.builder()
                .projectId(1L)
                .userId(userId)
                .message("기존 내용")
                .build());

        given(chatMessageRepository.findById(chatId)).willReturn(Optional.of(chat));

        // When
        Result<Void> result = chatService.updateMessage(userId, chatId, newContent);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(chat.getMessage()).isEqualTo(newContent);
        assertThat(chat.getEditedAt()).isNotNull();
        then(publisher).should(times(1)).publishEvent(any(ChatMessageUpdatedEvent.class));
    }

    @Test
    @DisplayName("실패 <404>: 존재하지 않는 chatId인 경우 NotFoundError를 반환한다.")
    void updateMessage_Fail_NotFound() {
        // Given
        long userId = 10L;
        long chatId = 999L;

        given(chatMessageRepository.findById(chatId)).willReturn(Optional.empty());

        // When
        Result<Void> result = chatService.updateMessage(userId, chatId, "내용");

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(NotFoundError.class);
        then(publisher).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("실패 <403>: 작성자가 아닌 유저가 수정을 시도하면 ForbiddenError를 반환한다.")
    void updateMessage_Fail_Forbidden() {
        // Given
        long ownerId = 10L;
        long requesterId = 20L; // 다른 유저
        long chatId = 100L;

        ChatEntity chat = ChatEntity.builder()
                .userId(ownerId)
                .build();

        given(chatMessageRepository.findById(chatId)).willReturn(Optional.of(chat));

        // When
        Result<Void> result = chatService.updateMessage(requesterId, chatId, "해킹 시도");

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ForbiddenError.class);
        assertThat(result.getSingleErrorOrThrow().getMessage()).contains("자신의 메시지만");
        then(publisher).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("실패 <400>: 수정할 내용이 비어있으면 BadRequestError를 반환한다.")
    void updateMessage_Fail_BadRequest() {
        // Given
        long userId = 10L;
        long chatId = 100L;
        String emptyContent = "   ";

        ChatEntity chat = ChatEntity.builder()
                .userId(userId)
                .build();
        given(chatMessageRepository.findById(chatId)).willReturn(Optional.of(chat));

        // When
        Result<Void> result = chatService.updateMessage(userId, chatId, emptyContent);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(BadRequestError.class);
    }

    @Test
    @DisplayName("성공: 작성자 본인이 삭제를 요청하면 deletedAt을 업데이트하고 이벤트를 발행한다.")
    void deleteMessage_Success() {
        // Given
        long userId = 10L;
        long chatId = 100L;

        ChatEntity chat = spy(ChatEntity.builder()
                .projectId(1L)
                .userId(userId)
                .message("삭제될 메시지")
                .build());

        given(chatMessageRepository.findById(chatId)).willReturn(Optional.of(chat));

        // When
        Result<Void> result = chatService.deleteMessage(chatId, userId);

        // Then
        assertThat(result.isSuccess()).isTrue();
        assertThat(chat.getDeletedAt()).isNotNull(); // Soft Delete 검증
        then(publisher).should(times(1)).publishEvent(any(ChatMessageDeletedEvent.class));
    }

    @Test
    @DisplayName("실패 <404>: 존재하지 않는 chatId인 경우 NotFoundError를 반환한다.")
    void deleteMessage_Fail_NotFound() {
        // Given
        long userId = 10L;
        long chatId = 999L;

        given(chatMessageRepository.findById(chatId)).willReturn(Optional.empty());

        // When
        Result<Void> result = chatService.deleteMessage(chatId, userId);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(NotFoundError.class);
        then(publisher).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("실패 <403>: 작성자가 아닌 유저가 삭제를 시도하면 ForbiddenError를 반환한다.")
    void deleteMessage_Fail_Forbidden() {
        // Given
        long ownerId = 10L;
        long requesterId = 20L;
        long chatId = 100L;

        ChatEntity chat = ChatEntity.builder()
                .userId(ownerId)
                .build();

        given(chatMessageRepository.findById(chatId)).willReturn(Optional.of(chat));

        // When
        Result<Void> result = chatService.deleteMessage(chatId, requesterId);

        // Then
        assertThat(result.isFailure()).isTrue();
        assertThat(result.getSingleErrorOrThrow()).isInstanceOf(ForbiddenError.class);
        assertThat(result.getSingleErrorOrThrow().getMessage()).contains("자신의 메시지만");

        assertThat(chat.getDeletedAt()).isNull();
        then(publisher).shouldHaveNoInteractions();
    }
}