package com.mppm.service;

import com.mppm.dto.request.PlatformRequest;
import com.mppm.dto.response.PlatformResponse;
import com.mppm.entity.Platform;
import com.mppm.repository.PlatformRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PlatformService {

    private final PlatformRepository platformRepository;

    public List<PlatformResponse> listEnabledPlatforms() {
        return platformRepository.findAll().stream()
            .filter(platform -> Boolean.TRUE.equals(platform.getEnabled()))
            .map(this::toResponse)
            .toList();
    }

    public PlatformResponse create(PlatformRequest request) {
        if (platformRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("平台编码已存在");
        }

        Platform platform = new Platform();
        platform.setName(normalizeName(request.getName()));
        platform.setDisplayName(request.getDisplayName());
        platform.setIconUrl(request.getIconUrl());
        platform.setLoginUrl(request.getLoginUrl());
        platform.setHomeUrl(request.getHomeUrl());
        platform.setEnabled(Boolean.TRUE);

        Platform saved = platformRepository.save(platform);
        return toResponse(saved);
    }

    public PlatformResponse update(Long id, PlatformRequest request) {
        Platform platform = platformRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("平台不存在"));

        String newName = normalizeName(request.getName());
        if (!platform.getName().equals(newName) && platformRepository.existsByName(newName)) {
            throw new IllegalArgumentException("平台编码已存在");
        }

        platform.setName(newName);
        platform.setDisplayName(request.getDisplayName());
        platform.setIconUrl(request.getIconUrl());
        platform.setLoginUrl(request.getLoginUrl());
        platform.setHomeUrl(request.getHomeUrl());

        Platform saved = platformRepository.save(platform);
        return toResponse(saved);
    }

    public void delete(Long id) {
        platformRepository.deleteById(id);
    }

    private PlatformResponse toResponse(Platform platform) {
        return PlatformResponse.builder()
            .id(platform.getId())
            .name(platform.getName())
            .displayName(platform.getDisplayName())
            .iconUrl(platform.getIconUrl())
            .loginUrl(platform.getLoginUrl())
            .homeUrl(platform.getHomeUrl())
            .enabled(platform.getEnabled())
            .build();
    }

    private String normalizeName(String name) {
        if (!StringUtils.hasText(name)) {
            return name;
        }
        return name.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", "-");
    }
}

