package com.mppm.dto.response.sync;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SyncUploadResponse {
    private int synced;
    private List<SyncResult> results;
    private List<SyncConflict> conflicts;
}

