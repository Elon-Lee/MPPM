package com.mppm.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PublishTaskStatusRequest {
    @NotBlank(message = "状态不能为空")
    private String status;
    private String publishUrl;
    private String errorMessage;
}

