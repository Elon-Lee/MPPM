package com.mppm.controller;

import com.mppm.dto.response.ApiResponse;
import com.mppm.dto.response.PlatformResponse;
import com.mppm.service.PlatformService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/platforms")
@RequiredArgsConstructor
@Tag(name = "平台管理", description = "平台信息接口")
public class PlatformController {

    private final PlatformService platformService;

    @GetMapping
    @Operation(summary = "平台列表")
    public ApiResponse<List<PlatformResponse>> listPlatforms() {
        return ApiResponse.success(platformService.listEnabledPlatforms());
    }
}

