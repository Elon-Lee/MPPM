package com.mppm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PlatformAccountRequest {
    @NotNull(message = "平台不能为空")
    private Long platformId;

    @NotBlank(message = "账号名称不能为空")
    private String accountName;

    private String credentials;

    private String status;
}

