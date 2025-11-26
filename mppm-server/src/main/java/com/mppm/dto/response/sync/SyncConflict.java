package com.mppm.dto.response.sync;

import com.mppm.dto.response.ContentResponse;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SyncConflict {
    private String localId;
    private Long serverId;
    private Integer localVersion;
    private Integer serverVersion;
    private String conflictType;
    private String message;
    private ContentResponse serverData;
}

