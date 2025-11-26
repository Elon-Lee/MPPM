package com.mppm.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ContentResponse {
    private Long id;
    private String title;
    private String content;
    private String contentType;
    private String status;
    private Integer version;
    private LocalDateTime lastSyncAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

