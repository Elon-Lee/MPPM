package com.mppm.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClientLogRequest {
    @NotBlank
    private String level;

    private String module;

    @NotBlank
    private String message;

    private String stackTrace;

    private String clientInfo;
}

