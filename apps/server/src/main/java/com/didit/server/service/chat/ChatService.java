package com.didit.server.service.chat;

import com.didit.server.data.entity.ChatEntity;
import com.didit.server.share.result.Result;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ChatService {
    /**
     * Action: 특정 채널(프로젝트 또는 미팅) 내에서 메시지를 생성하고 실시간으로 방송함
     * Input:
     * - long channelId: 메시지를 보낼 채널 ID (프로젝트 ID 혹은 미팅 ID)
     * - long userId: 메시지 작성자 ID
     * - String content: 채팅 메시지 내용
     * Success:
     * - ok(Void): DB 저장 및 해당 채널(broadcastId)로 ChatMessageCreatedEvent 발행
     * Auth/Permission:
     * - 채널 ID를 해석하여 해당 프로젝트의 멤버인 경우에만 전송 가능
     * Persistence:
     * - (ID 해석) meetingRepository 조회 후 projectId 및 meetingId 구분
     * - (저장) chatMessageRepository.save 호출
     * Failures:
     * - <400>: content가 null이거나 비어있는 경우 BadRequestError 반환
     * - <403>: 해당 프로젝트/미팅의 멤버가 아닌 경우 ForbiddenError 반환
     */
    Result<Void> sendMessage(long channelId, long userId, String content);
    /**
     * Action: 커서(lastId) 기반 페이징을 사용하여 특정 채널의 과거 채팅 내역을 조회함
     * Input:
     * - long channelId: 조회할 채널 ID (프로젝트 혹은 미팅)
     * - long userId: 조회를 요청한 유저 ID
     * - Long lastId: 기준이 되는 마지막 메시지 ID (최초 조회 시 null)
     * - Pageable pageable: 페이징 옵션 (기본 20개)
     * Success:
     * - ok(List<ChatEntity>): 해당 채널에 귀속된 삭제되지 않은 채팅 리스트
     * Auth/Permission:
     * - 조회를 요청한 유저가 해당 채널의 멤버인지 검증 (ForbiddenError)
     * Persistence:
     * - (조회) meetingId 유무에 따라 getProjectMessages 혹은 getMeetingMessages 호출
     * Failures:
     * - <404>: 존재하지 않는 프로젝트 ID인 경우 NotFoundError 반환
     * - <403>: 채널 멤버가 아닌 경우 ForbiddenError 반환
     * - <500>: DB 조회 중 예외 발생 시 ServerError 반환
     */
    Result<List<ChatEntity>> getMessage(long channelId, long userId, Long lastId, Pageable pageable);
    /**
     * Action: 기존에 작성된 채팅 메시지의 내용을 수정하고 실시간으로 수정 이벤트를 방송함
     * Input:
     * - long userId: 수정을 요청한 유저 ID
     * - long chatId: 수정할 메시지 ID
     * - String content: 새 메시지 내용
     * Success:
     * - ok(Void): 성공 시 DB 업데이트(Dirty Checking) 및 ChatMessageUpdatedEvent 발행
     * Auth/Permission:
     * - 메시지 소유자(userId)만 수정 가능
     * Persistence:
     * - (찾기) chatMessageRepository.findById
     * - (수정) chat.setMessage, chat.setEditedAt (Transaction 내 자동 반영)
     * Failures:
     * - <404>: 존재하지 않는 chatId인 경우 NotFoundError 반환
     * - <403>: 작성자가 아닌 유저가 수정을 시도할 경우 ForbiddenError 반환
     * - <400>: content가 비어있을 경우 BadRequestError 반환
     */
    Result<Void> updateMessage(long userId, long chatId, String content);
    /**
     * Action: 특정 채팅 메시지를 논리 삭제(Soft Delete)하고 실시간으로 삭제 이벤트를 방송함
     * Input:
     * - long chatId: 삭제할 메시지 ID
     * - long userId: 삭제를 요청한 유저 ID
     * Success:
     * - ok(Void): 성공 시 deletedAt 필드 업데이트 및 ChatMessageDeletedEvent 발행
     * Auth/Permission:
     * - 메시지 소유자(userId)만 삭제 가능
     * Persistence:
     * - (찾기) chatMessageRepository.findById
     * - (삭제) chat.setDeletedAt (Soft Delete 처리)
     * Failures:
     * - <404>: 존재하지 않는 chatId인 경우 NotFoundError 반환
     * - <403>: 작성자가 아닌 유저가 삭제를 시도할 경우 ForbiddenError 반환
     */
    Result<Void> deleteMessage(long chatId, long userId);
    /**
     * Action: 유저가 특정 채널(프로젝트/미팅)에 접근할 수 있는 멤버인지 확인 (SSE 구독 등에서 활용)
     * Input:
     * - long channelId: 확인할 채널 ID
     * - long userId: 확인할 유저 ID
     * Return:
     * - boolean: 멤버 여부 (true/false)
     */
    boolean checkMembership(long channelId, long userId);

    boolean checkMembershipInProject(long channelId, long userId);
}
