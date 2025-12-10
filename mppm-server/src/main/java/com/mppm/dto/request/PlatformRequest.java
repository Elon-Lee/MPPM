package com.mppm.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PlatformRequest {
    /**
     * 平台唯一标识（英文/拼音），用于内部引用
     */
    @NotBlank(message = "平台编码不能为空")
    private String name;

    /**
     * 平台显示名称
     */
    @NotBlank(message = "平台名称不能为空")
    private String displayName;

    /**
     * 平台图标 URL
     */
    private String iconUrl;

    /**
     * 平台登录地址
     */
    @NotBlank(message = "平台登录地址不能为空")
    private String loginUrl;

    /**
     * 平台首页地址
     */
    private String homeUrl;
}

