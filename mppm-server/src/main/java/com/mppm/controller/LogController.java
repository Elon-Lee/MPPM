package com.mppm.controller;

import com.mppm.dto.request.ClientLogRequest;
import com.mppm.dto.response.ApiResponse;
import com.mppm.security.SecurityUtils;
import com.mppm.service.LogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/logs")
@RequiredArgsConstructor
@Tag(name = "客户端日志", description = "收集客户端错误日志")
public class LogController {

    private final LogService logService;

    @PostMapping
    @Operation(summary = "上报日志")
    public ApiResponse<Boolean> submit(@Valid @RequestBody ClientLogRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        logService.record(userId, request);
        return ApiResponse.success(true);
    }
}

