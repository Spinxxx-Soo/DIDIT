package com.didit.server.api.controller;

import com.didit.server.api.response.UserResponse;
import com.didit.server.api.security.CustomOAuth2User;
import com.didit.server.data.entity.UserEntity;
import com.didit.server.service.service.UserService;
import com.didit.server.share.result.Result;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class Oauth2Controller {

    private final UserService userService;

    @GetMapping("/login")
    public void login(HttpServletResponse response) throws IOException {
        response.sendRedirect("/oauth2/authorization/github");
    }

    // 세션 유지 확인용 테스트 엔드포인트
    @GetMapping("/me")
    public ResponseEntity<?> hasAuth(@AuthenticationPrincipal CustomOAuth2User user) {
        if (user == null || user.getId() == null) {
            return new ResponseEntity<>(HttpStatusCode.valueOf(401));
        }
        var findResult = userService.findUserById(user.getId());
        if(findResult.isFailure()){
            var err = findResult.getSingleErrorOrThrow().getResponse();
            return new ResponseEntity<>(err, err.getStatusCode());
        }
        return ResponseEntity.ok(UserResponse.fromEntity(findResult.getOrThrow()));
    }

}
