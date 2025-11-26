package com.mppm.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PublishTaskRequest {
    @NotNull(message = "内容ID不能为空")
    private Long contentId;

    @NotNull(message = "平台ID不能为空")
    private Long platformId;

    private String config;
}

