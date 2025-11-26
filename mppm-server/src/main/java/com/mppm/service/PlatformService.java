package com.mppm.service;

import com.mppm.dto.response.PlatformResponse;
import com.mppm.entity.Platform;
import com.mppm.repository.PlatformRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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

    private PlatformResponse toResponse(Platform platform) {
        return PlatformResponse.builder()
            .id(platform.getId())
            .name(platform.getName())
            .displayName(platform.getDisplayName())
            .enabled(platform.getEnabled())
            .build();
    }
}

