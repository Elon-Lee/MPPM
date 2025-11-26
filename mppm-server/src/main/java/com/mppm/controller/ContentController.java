package com.mppm.controller;

import com.mppm.dto.request.ContentRequest;
import com.mppm.dto.request.ContentUpdateRequest;
import com.mppm.dto.response.ApiResponse;
import com.mppm.dto.response.ContentResponse;
import com.mppm.dto.response.PageResponse;
import com.mppm.security.SecurityUtils;
import com.mppm.service.ContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/contents")
@RequiredArgsConstructor
@Tag(name = "内容管理", description = "内容 CRUD 接口")
public class ContentController {

    private final ContentService contentService;

    @GetMapping
    @Operation(summary = "内容列表", description = "分页查询内容")
    public ApiResponse<PageResponse<ContentResponse>> list(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String keyword
    ) {
        Long userId = requireUserId();
        PageResponse<ContentResponse> response = contentService.listContents(userId, page, size, status, keyword);
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "内容详情", description = "获取指定内容详情")
    public ApiResponse<ContentResponse> detail(@PathVariable Long id) {
        Long userId = requireUserId();
        return ApiResponse.success(contentService.getContent(userId, id));
    }

    @PostMapping
    @Operation(summary = "创建内容")
    public ApiResponse<ContentResponse> create(@Valid @RequestBody ContentRequest request) {
        Long userId = requireUserId();
        return ApiResponse.success(contentService.createContent(userId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新内容")
    public ApiResponse<ContentResponse> update(@PathVariable Long id,
                                               @Valid @RequestBody ContentUpdateRequest request) {
        Long userId = requireUserId();
        return ApiResponse.success(contentService.updateContent(userId, id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "删除内容")
    public ApiResponse<Boolean> delete(@PathVariable Long id) {
        Long userId = requireUserId();
        contentService.deleteContent(userId, id);
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

