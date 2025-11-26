package com.mppm.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PublishTaskResponse {
    private Long id;
    private Long contentId;
    private Long platformId;
    private String platformName;
    private String status;
    private String publishUrl;
    private String errorMessage;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
}

