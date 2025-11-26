package com.mppm.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mppm.dto.request.ClientLogRequest;
import com.mppm.entity.SystemLog;
import com.mppm.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LogService {

    private final SystemLogRepository systemLogRepository;
    private final ObjectMapper objectMapper;

    public void record(Long userId, ClientLogRequest request) {
        SystemLog log = new SystemLog();
        log.setUserId(userId);
        log.setLevel(request.getLevel());
        log.setModule(request.getModule());
        log.setMessage(request.getMessage());
        log.setStackTrace(request.getStackTrace());
        log.setClientInfo(toJson(request.getClientInfo()));

        systemLogRepository.save(log);
    }

    private String toJson(String raw) {
        if (raw == null || raw.isEmpty()) {
            return null;
        }
        try {
            // ensure valid JSON
            Object tree = objectMapper.readTree(raw);
            return objectMapper.writeValueAsString(tree);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}

