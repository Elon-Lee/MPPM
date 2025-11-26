package com.mppm.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ContentUpdateRequest extends ContentRequest {

    @NotNull(message = "版本号不能为空")
    private Integer version;
}

