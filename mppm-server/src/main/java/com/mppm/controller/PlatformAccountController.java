package com.mppm.controller;

import com.mppm.dto.request.PlatformAccountRequest;
import com.mppm.dto.response.ApiResponse;
import com.mppm.dto.response.PlatformAccountResponse;
import com.mppm.security.SecurityUtils;
import com.mppm.service.PlatformAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/platform/accounts")
@RequiredArgsConstructor
@Tag(name = "平台账号", description = "多平台账号管理接口")
public class PlatformAccountController {

    private final PlatformAccountService platformAccountService;

    @GetMapping
    @Operation(summary = "账号列表")
    public ApiResponse<List<PlatformAccountResponse>> list(@RequestParam(required = false) Long platformId,
                                                           @RequestParam(required = false) String keyword) {
        return ApiResponse.success(
            platformAccountService.listAccounts(requireUserId(), platformId, keyword)
        );
    }

    @PostMapping
    @Operation(summary = "添加账号")
    public ApiResponse<PlatformAccountResponse> create(@Valid @RequestBody PlatformAccountRequest request) {
        return ApiResponse.success(platformAccountService.create(requireUserId(), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新账号")
    public ApiResponse<PlatformAccountResponse> update(@PathVariable Long id,
                                                       @Valid @RequestBody PlatformAccountRequest request) {
        return ApiResponse.success(platformAccountService.update(requireUserId(), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除账号")
    public ApiResponse<Boolean> delete(@PathVariable Long id) {
        platformAccountService.delete(requireUserId(), id);
        return ApiResponse.success(true);
    }

    private Long requireUserId() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new RuntimeException("未授权");
        }
        return userId;
    }
}

