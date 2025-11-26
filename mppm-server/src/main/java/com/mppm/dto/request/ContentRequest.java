package com.mppm.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContentRequest {

    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题长度不能超过200个字符")
    private String title;

    private String content;

    @NotBlank(message = "内容类型不能为空")
    private String contentType = "ARTICLE";

    @NotBlank(message = "内容状态不能为空")
    private String status = "DRAFT";
}

