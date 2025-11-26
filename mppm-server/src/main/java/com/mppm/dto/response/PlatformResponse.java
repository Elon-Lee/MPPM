package com.mppm.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlatformResponse {
    private Long id;
    private String name;
    private String displayName;
    private Boolean enabled;
}

