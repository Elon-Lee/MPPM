package com.mppm.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @Size(min = 6, max = 64)
    private String newPassword;
}

