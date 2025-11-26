package com.mppm.dto.response.sync;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SyncResult {
    private String localId;
    private Long serverId;
    private Integer version;
}

