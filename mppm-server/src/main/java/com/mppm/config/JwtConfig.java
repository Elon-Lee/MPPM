package com.mppm.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtConfig {
    private String secret = "your-secret-key-change-in-production-min-256-bits";
    private Long accessTokenExpiration = 3600000L; // 1 hour
    private Long refreshTokenExpiration = 604800000L; // 7 days
}

