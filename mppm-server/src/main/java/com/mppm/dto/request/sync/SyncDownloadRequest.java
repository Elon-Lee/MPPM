package com.mppm.dto.request.sync;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SyncDownloadRequest {
    @NotBlank
    private String entityType;

    private String lastSyncAt; // ISO 8601 datetime string

    private String clientVersion;
}

