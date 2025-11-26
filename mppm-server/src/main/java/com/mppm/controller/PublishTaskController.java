package com.mppm.controller;

import com.mppm.dto.request.PublishTaskRequest;
import com.mppm.dto.request.PublishTaskStatusRequest;
import com.mppm.dto.response.ApiResponse;
import com.mppm.dto.response.PageResponse;
import com.mppm.dto.response.PublishTaskResponse;
import com.mppm.security.SecurityUtils;
import com.mppm.service.PublishTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/publish/tasks")
@RequiredArgsConstructor
@Tag(name = "发布任务", description = "内容发布任务管理接口")
public class PublishTaskController {

    private final PublishTaskService publishTaskService;

    @GetMapping
    @Operation(summary = "任务列表")
    public ApiResponse<PageResponse<PublishTaskResponse>> list(@RequestParam(defaultValue = "1") int page,
                                                               @RequestParam(defaultValue = "10") int size,
                                                               @RequestParam(required = false) String status,
                                                               @RequestParam(required = false) Long platformId) {
        return ApiResponse.success(
            publishTaskService.listTasks(requireUserId(), page, size, status, platformId)
        );
    }

    @PostMapping
    @Operation(summary = "创建发布任务")
    public ApiResponse<PublishTaskResponse> create(@Valid @RequestBody PublishTaskRequest request) {
        return ApiResponse.success(publishTaskService.createTask(requireUserId(), request));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "更新任务状态")
    public ApiResponse<PublishTaskResponse> updateStatus(@PathVariable Long id,
                                                         @Valid @RequestBody PublishTaskStatusRequest request) {
        return ApiResponse.success(publishTaskService.updateStatus(requireUserId(), id, request));
    }

    private Long requireUserId() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new RuntimeException("未授权");
        }
        return userId;
    }
}

