package com.mppm.dto.request.sync;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SyncEntityRequest {
    @NotBlank
    private String localId;
    private Long serverId;
    @NotNull
    private Integer version;
    private Long lastModified; // epoch millis
    @NotNull
    private SyncContentData data;
}

