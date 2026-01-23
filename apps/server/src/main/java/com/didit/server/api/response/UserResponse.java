package com.didit.server.api.response;

import com.didit.server.data.entity.UserEntity;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    // GitHub numeric user id (UK, NOT NULL)
    private Long githubId;
    // GitHub 로그인 핸들 (UK, NOT NULL)
    private String githubLogin;
    // 표시 이름 (NULL 가능)
    private String name;
    private String avatarUrl;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;


    public static UserResponse fromEntity(UserEntity entity){
        return UserResponse.builder()
                .id(entity.getId())
                .githubId(entity.getGithubId())
                .githubLogin(entity.getGithubLogin())
                .name(entity.getName())
                .avatarUrl(entity.getAvatarUrl())
                .createdAt(entity.getCreatedAt())
                .lastLoginAt(entity.getLastLoginAt())
                .build();
    }
}
