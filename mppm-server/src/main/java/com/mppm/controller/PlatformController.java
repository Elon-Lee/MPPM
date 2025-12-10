package com.mppm.controller;

import com.mppm.dto.request.PlatformRequest;
import com.mppm.dto.response.ApiResponse;
import com.mppm.dto.response.PlatformResponse;
import com.mppm.service.PlatformService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import jakarta.validation.Valid;

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

    @PostMapping
    @Operation(summary = "创建平台")
    public ApiResponse<PlatformResponse> createPlatform(@Valid @RequestBody PlatformRequest request) {
        return ApiResponse.success(platformService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "编辑平台")
    public ApiResponse<PlatformResponse> updatePlatform(@PathVariable Long id, @Valid @RequestBody PlatformRequest request) {
        return ApiResponse.success(platformService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除平台")
    public ApiResponse<Void> deletePlatform(@PathVariable Long id) {
        platformService.delete(id);
        return ApiResponse.success(null);
    }
}

