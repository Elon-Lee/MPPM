package com.mppm.dto.response.sync;

import com.mppm.dto.response.ContentResponse;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SyncDownloadResponse {
    private List<ContentResponse> entities;
    private List<Long> deleted;
    private String serverTime;
}

