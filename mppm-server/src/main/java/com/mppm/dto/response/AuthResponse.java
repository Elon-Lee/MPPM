package com.mppm.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private Long expiresIn;
    private UserInfo user;

    @Data
    public static class UserInfo {
        private Long id;
        private String username;
        private String email;
        private String nickname;
        private String avatarUrl;
        private List<String> roles;
    }
}

