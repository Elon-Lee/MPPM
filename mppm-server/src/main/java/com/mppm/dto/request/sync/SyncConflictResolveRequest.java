package com.mppm.dto.request.sync;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SyncConflictResolveRequest {
    @NotBlank
    private String resolution; // USE_CLIENT, USE_SERVER, MERGE

    @NotNull
    private Long serverId;

    private String localId;

    private SyncContentData mergedData;
}

