package com.mppm.service;

import com.mppm.config.JwtConfig;
import com.mppm.dto.request.LoginRequest;
import com.mppm.dto.request.RefreshTokenRequest;
import com.mppm.dto.response.AuthResponse;
import com.mppm.entity.RefreshToken;
import com.mppm.entity.Role;
import com.mppm.entity.User;
import com.mppm.repository.RefreshTokenRepository;
import com.mppm.repository.UserRepository;
import com.mppm.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final JwtConfig jwtConfig;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("用户名或密码错误"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("用户名或密码错误");
        }

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new RuntimeException("账户已被禁用");
        }

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getUsername());
        String refreshToken = rotateRefreshToken(user, null);

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
            .orElseThrow(() -> new RuntimeException("刷新令牌无效"));

        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(storedToken);
            throw new RuntimeException("刷新令牌已过期");
        }

        if (!tokenProvider.validateToken(request.getRefreshToken())) {
            refreshTokenRepository.delete(storedToken);
            throw new RuntimeException("刷新令牌无效");
        }

        Long userId = storedToken.getUserId();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("用户不存在"));

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getUsername());
        String newRefreshToken = rotateRefreshToken(user, request.getRefreshToken());

        return buildAuthResponse(user, accessToken, newRefreshToken);
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.findByToken(request.getRefreshToken())
            .ifPresent(refreshTokenRepository::delete);
    }

    private String rotateRefreshToken(User user, String oldRefreshToken) {
        if (oldRefreshToken != null) {
            refreshTokenRepository.deleteByToken(oldRefreshToken);
        } else {
            // 清理旧的 Refresh Token
            refreshTokenRepository.deleteByUserId(user.getId());
        }

        String refreshToken = tokenProvider.generateRefreshToken(user.getId());
        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setUserId(user.getId());
        refreshTokenEntity.setToken(refreshToken);
        refreshTokenEntity.setExpiresAt(LocalDateTime.now().plusSeconds(jwtConfig.getRefreshTokenExpiration()));

        refreshTokenRepository.save(refreshTokenEntity);
        return refreshToken;
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        AuthResponse response = new AuthResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setExpiresIn(jwtConfig.getAccessTokenExpiration() / 1000);

        response.setUser(toUserInfo(user));
        response.setUser(toUserInfo(user));

        return response;
    }

    private AuthResponse.UserInfo toUserInfo(User user) {
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo();
        userInfo.setId(user.getId());
        userInfo.setUsername(user.getUsername());
        userInfo.setEmail(user.getEmail());
        userInfo.setNickname(user.getNickname());
        userInfo.setAvatarUrl(user.getAvatarUrl());
        userInfo.setRoles(user.getRoles().stream()
            .map(Role::getCode)
            .toList());
        return userInfo;
    }
}

