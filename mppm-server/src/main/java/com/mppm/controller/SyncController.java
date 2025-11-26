package com.mppm.controller;

import com.mppm.dto.request.sync.SyncDownloadRequest;
import com.mppm.dto.request.sync.SyncUploadRequest;
import com.mppm.dto.response.ApiResponse;
import com.mppm.dto.response.sync.SyncDownloadResponse;
import com.mppm.dto.response.sync.SyncUploadResponse;
import com.mppm.security.SecurityUtils;
import com.mppm.service.SyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/sync")
@RequiredArgsConstructor
@Tag(name = "数据同步", description = "客户端数据同步接口")
public class SyncController {

    private final SyncService syncService;

    @PostMapping("/upload")
    @Operation(summary = "上传客户端数据")
    public ApiResponse<SyncUploadResponse> upload(@Valid @RequestBody SyncUploadRequest request) {
        Long userId = requireUserId();
        return ApiResponse.success(syncService.upload(userId, request));
    }

    @PostMapping("/download")
    @Operation(summary = "下载服务器数据")
    public ApiResponse<SyncDownloadResponse> download(@Valid @RequestBody SyncDownloadRequest request) {
        Long userId = requireUserId();
        return ApiResponse.success(syncService.download(userId, request));
    }

    private Long requireUserId() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new RuntimeException("未授权");
        }
        return userId;
    }
}

