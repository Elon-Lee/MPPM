package com.mppm.service;

import com.mppm.dto.request.PlatformAccountRequest;
import com.mppm.dto.response.PlatformAccountResponse;
import com.mppm.entity.Platform;
import com.mppm.entity.PlatformAccount;
import com.mppm.repository.PlatformAccountRepository;
import com.mppm.repository.PlatformRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlatformAccountService {

    private final PlatformAccountRepository platformAccountRepository;
    private final PlatformRepository platformRepository;

    public List<PlatformAccountResponse> listAccounts(Long userId, Long platformId, String keyword) {
        return platformAccountRepository.search(userId, platformId, keyword).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public PlatformAccountResponse create(Long userId, PlatformAccountRequest request) {
        Platform platform = platformRepository.findById(request.getPlatformId())
            .orElseThrow(() -> new RuntimeException("平台不存在"));

        PlatformAccount account = new PlatformAccount();
        account.setUserId(userId);
        account.setPlatform(platform);
        account.setAccountName(request.getAccountName());
        account.setStatus(request.getStatus() != null ? request.getStatus() : "ACTIVE");
        account.setEncryptedCredentials(request.getCredentials());

        return toResponse(platformAccountRepository.save(account));
    }

    @Transactional
    public PlatformAccountResponse update(Long userId, Long accountId, PlatformAccountRequest request) {
        PlatformAccount account = platformAccountRepository.findById(accountId)
            .orElseThrow(() -> new RuntimeException("账号不存在"));

        if (!account.getUserId().equals(userId)) {
            throw new RuntimeException("没有权限操作该账号");
        }

        if (request.getPlatformId() != null &&
            (account.getPlatform() == null || !account.getPlatform().getId().equals(request.getPlatformId()))) {
            Platform platform = platformRepository.findById(request.getPlatformId())
                .orElseThrow(() -> new RuntimeException("平台不存在"));
            account.setPlatform(platform);
        }

        account.setAccountName(request.getAccountName());
        if (request.getStatus() != null) {
            account.setStatus(request.getStatus());
        }
        if (request.getCredentials() != null) {
            account.setEncryptedCredentials(request.getCredentials());
        }

        return toResponse(platformAccountRepository.save(account));
    }

    @Transactional
    public void delete(Long userId, Long accountId) {
        PlatformAccount account = platformAccountRepository.findById(accountId)
            .orElseThrow(() -> new RuntimeException("账号不存在"));
        if (!account.getUserId().equals(userId)) {
            throw new RuntimeException("没有权限操作该账号");
        }
        platformAccountRepository.delete(account);
    }

    private PlatformAccountResponse toResponse(PlatformAccount account) {
        return PlatformAccountResponse.builder()
            .id(account.getId())
            .platformId(account.getPlatform() != null ? account.getPlatform().getId() : null)
            .platformName(account.getPlatform() != null ? account.getPlatform().getName() : null)
            .platformDisplayName(account.getPlatform() != null ? account.getPlatform().getDisplayName() : null)
            .accountName(account.getAccountName())
            .status(account.getStatus())
            .lastUpdatedAt(account.getUpdatedAt())
            .build();
    }
}

