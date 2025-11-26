package com.mppm.service;

import com.mppm.dto.request.PublishTaskRequest;
import com.mppm.dto.request.PublishTaskStatusRequest;
import com.mppm.dto.response.PageResponse;
import com.mppm.dto.response.PublishTaskResponse;
import com.mppm.entity.Platform;
import com.mppm.entity.PublishTask;
import com.mppm.repository.PlatformRepository;
import com.mppm.repository.PublishTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PublishTaskService {

    private final PublishTaskRepository publishTaskRepository;
    private final PlatformRepository platformRepository;

    public PageResponse<PublishTaskResponse> listTasks(Long userId, int page, int size, String status, Long platformId) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), size,
            Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PublishTask> result = publishTaskRepository.search(userId, status, platformId, pageable);

        return PageResponse.<PublishTaskResponse>builder()
            .data(result.stream().map(this::toResponse).toList())
            .total(result.getTotalElements())
            .page(page)
            .size(size)
            .build();
    }

    @Transactional
    public PublishTaskResponse createTask(Long userId, PublishTaskRequest request) {
        Platform platform = platformRepository.findById(request.getPlatformId())
            .orElseThrow(() -> new RuntimeException("平台不存在"));

        PublishTask task = new PublishTask();
        task.setUserId(userId);
        task.setContentId(request.getContentId());
        task.setPlatform(platform);
        task.setStatus("PENDING");
        task.setConfig(request.getConfig());

        return toResponse(publishTaskRepository.save(task));
    }

    @Transactional
    public PublishTaskResponse updateStatus(Long userId, Long taskId, PublishTaskStatusRequest request) {
        PublishTask task = publishTaskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("任务不存在"));
        if (!task.getUserId().equals(userId)) {
            throw new RuntimeException("无权限操作该任务");
        }

        task.setStatus(request.getStatus());
        task.setPublishUrl(request.getPublishUrl());
        task.setErrorMessage(request.getErrorMessage());

        if ("RUNNING".equalsIgnoreCase(request.getStatus())) {
            task.setStartedAt(LocalDateTime.now());
        }
        if ("SUCCESS".equalsIgnoreCase(request.getStatus()) ||
            "FAILED".equalsIgnoreCase(request.getStatus())) {
            task.setCompletedAt(LocalDateTime.now());
        }

        return toResponse(publishTaskRepository.save(task));
    }

    private PublishTaskResponse toResponse(PublishTask task) {
        return PublishTaskResponse.builder()
            .id(task.getId())
            .contentId(task.getContentId())
            .platformId(task.getPlatform() != null ? task.getPlatform().getId() : null)
            .platformName(task.getPlatform() != null ? task.getPlatform().getDisplayName() : null)
            .status(task.getStatus())
            .publishUrl(task.getPublishUrl())
            .errorMessage(task.getErrorMessage())
            .startedAt(task.getStartedAt())
            .completedAt(task.getCompletedAt())
            .createdAt(task.getCreatedAt())
            .build();
    }
}

