package com.didit.server.service.service.impl;

import com.didit.server.data.entity.UserEntity;
import com.didit.server.data.entity.UserGithubAuthEntity;
import com.didit.server.data.repository.UserGithubAuthRepository;
import com.didit.server.data.repository.UserRepository;
import com.didit.server.service.service.UserService;
import com.didit.server.share.result.Result;
import com.didit.server.share.result.impl.NotFoundError;
import com.didit.server.share.result.impl.ServerError;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserGithubAuthRepository userGithubAuthRepository;

    @Transactional
    public Result<UserEntity> joinOrUpdate(Long githubId, String login, String name, String avatarUrl) {
        try {
            UserEntity user = userRepository.findByGithubId(githubId).orElse(null);

            if (user == null) {
                user = UserEntity.builder()
                        .githubId(githubId)
                        .githubLogin(login)
                        .name(name)
                        .avatarUrl(avatarUrl)
                        .createdAt(LocalDateTime.now())
                        .lastLoginAt(LocalDateTime.now())
                        .build();
            } else {
                user.setGithubLogin(login);
                user.setAvatarUrl(avatarUrl);
                user.setName(name);
                user.setLastLoginAt(LocalDateTime.now());
            }

            return Result.ok(userRepository.save(user));
        } catch (Exception e) {
            return Result.fail(500, "Internal Server Error");
        }
    }

    @Override
    public Result<UserEntity> findUserById(Long userId) {
        var user = userRepository.findById(userId);
        return user.map(Result::ok).orElseGet(() -> Result.fail(new NotFoundError("userId", userId)));

    }

    @Override
    @Transactional
    public Result<Void> saveUserGithubAuthInfo(UserEntity user, String token, String scope){
        try {
            UserGithubAuthEntity auth = userGithubAuthRepository.findById(user.getId())
                    .orElse(null);
            if (auth == null){
                auth = UserGithubAuthEntity.builder()
                        .userId(user.getId())
                        .user(user)
                        .accessToken(token)
                        .scope(scope)
                        .tokenUpdatedAt(LocalDateTime.now())
                        .build();
            }
            else {
                auth.setAccessToken(token);
                auth.setScope(scope);
                auth.setTokenUpdatedAt(LocalDateTime.now());
            }
            userGithubAuthRepository.save(auth);
            return Result.ok();
        } catch (RuntimeException e) {
            return Result.fail(new ServerError("GithubAuthSave", user.getId()));
        }
    }
}

