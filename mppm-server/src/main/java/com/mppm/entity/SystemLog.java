package com.mppm.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_logs")
@Data
@EntityListeners(AuditingEntityListener.class)
public class SystemLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(length = 10, nullable = false)
    private String level;

    @Column(length = 50)
    private String module;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(name = "stack_trace", columnDefinition = "text")
    private String stackTrace;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "client_info", columnDefinition = "jsonb")
    private String clientInfo;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

