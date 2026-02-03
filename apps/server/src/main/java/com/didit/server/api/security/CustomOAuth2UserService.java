package com.didit.server.api.security;

import com.didit.server.data.entity.UserEntity;
import com.didit.server.service.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserService userService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. 깃허브에서 정보 가져오기
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // 1-1. accessToken, scope 추출하기
        String accessToken = userRequest.getAccessToken().getTokenValue();
        Set<String> getScopes = userRequest.getAccessToken().getScopes();
        String scope = String.join(",", getScopes);

        log.info("깃허브 데이터: {}", attributes);

        // 2. 필요한 정보 추출하기
        Long githubId = ((Number) attributes.get("id")).longValue();
        String login = attributes.get("login").toString();
        String name = attributes.get("name") != null ? attributes.get("name").toString() : login;
        String avatarUrl = attributes.get("avatar_url").toString();

        UserEntity newUser = userService.joinOrUpdate(githubId, login, name, avatarUrl).getOrThrow();
        log.info("auth save input user.id = {}", newUser.getId());
        var authResult = userService.saveUserGithubAuthInfo(newUser.getId(), accessToken, scope);
        if (authResult.isFailure()) {
            throw new OAuth2AuthenticationException("깃허브 인증 정보를 저장할 수 없습니다.");
        }

        return new CustomOAuth2User(oAuth2User, newUser.getId(), accessToken);
    }
}
