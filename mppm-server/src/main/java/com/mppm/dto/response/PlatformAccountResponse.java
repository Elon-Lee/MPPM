package com.mppm.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PlatformAccountResponse {
    private Long id;
    private Long platformId;
    private String platformName;
    private String platformDisplayName;
    private String accountName;
    private String status;
    private LocalDateTime lastUpdatedAt;
}

