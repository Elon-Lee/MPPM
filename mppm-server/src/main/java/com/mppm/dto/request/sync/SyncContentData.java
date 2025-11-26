package com.mppm.dto.request.sync;

import lombok.Data;

@Data
public class SyncContentData {
    private String title;
    private String content;
    private String contentType;
    private String status;
}

