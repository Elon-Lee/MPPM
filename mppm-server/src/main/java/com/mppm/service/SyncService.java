package com.mppm.service;

import com.mppm.dto.request.sync.SyncDownloadRequest;
import com.mppm.dto.request.sync.SyncEntityRequest;
import com.mppm.dto.request.sync.SyncUploadRequest;
import com.mppm.dto.response.ContentResponse;
import com.mppm.dto.response.sync.SyncConflict;
import com.mppm.dto.response.sync.SyncDownloadResponse;
import com.mppm.dto.response.sync.SyncResult;
import com.mppm.dto.response.sync.SyncUploadResponse;
import com.mppm.entity.Content;
import com.mppm.repository.ContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class SyncService {

    private static final String CONTENT_ENTITY = "CONTENT";

    private final ContentRepository contentRepository;
    private final ContentService contentService;

    @Transactional
    public SyncUploadResponse upload(Long userId, SyncUploadRequest request) {
        if (!CONTENT_ENTITY.equalsIgnoreCase(request.getEntityType())) {
            throw new UnsupportedOperationException("暂不支持该实体类型同步");
        }

        List<SyncResult> results = new ArrayList<>();
        List<SyncConflict> conflicts = new ArrayList<>();

        for (SyncEntityRequest entity : request.getEntities()) {
            try {
                handleContentSyncEntity(userId, entity, results, conflicts);
            } catch (RuntimeException ex) {
                conflicts.add(SyncConflict.builder()
                    .localId(entity.getLocalId())
                    .serverId(entity.getServerId())
                    .localVersion(entity.getVersion())
                    .conflictType("SERVER_ERROR")
                    .message(ex.getMessage())
                    .build());
            }
        }

        return SyncUploadResponse.builder()
            .synced(results.size())
            .results(results)
            .conflicts(conflicts)
            .build();
    }

    private void handleContentSyncEntity(Long userId,
                                         SyncEntityRequest entity,
                                         List<SyncResult> results,
                                         List<SyncConflict> conflicts) {
        if (entity.getServerId() != null) {
            Content content = contentRepository.findByIdAndUserId(entity.getServerId(), userId)
                .orElse(null);
            if (content == null) {
                conflicts.add(SyncConflict.builder()
                    .localId(entity.getLocalId())
                    .serverId(entity.getServerId())
                    .localVersion(entity.getVersion())
                    .conflictType("NOT_FOUND")
                    .message("服务器不存在对应内容")
                    .build());
                return;
            }

            if (!Objects.equals(entity.getVersion(), content.getVersion())) {
                conflicts.add(SyncConflict.builder()
                    .localId(entity.getLocalId())
                    .serverId(entity.getServerId())
                    .localVersion(entity.getVersion())
                    .serverVersion(content.getVersion())
                    .conflictType("VERSION_MISMATCH")
                    .message("存在版本冲突")
                    .build());
                return;
            }

            content.setTitle(entity.getData().getTitle());
            content.setContent(entity.getData().getContent());
            content.setContentType(entity.getData().getContentType());
            content.setStatus(entity.getData().getStatus());
            content.setVersion(content.getVersion() + 1);
            content.setLastSyncAt(LocalDateTime.now());
            contentRepository.save(content);

            results.add(SyncResult.builder()
                .localId(entity.getLocalId())
                .serverId(content.getId())
                .version(content.getVersion())
                .build());
        } else {
            Content content = new Content();
            content.setUserId(userId);
            content.setTitle(entity.getData().getTitle());
            content.setContent(entity.getData().getContent());
            content.setContentType(entity.getData().getContentType());
            content.setStatus(entity.getData().getStatus());
            content.setVersion(entity.getVersion());
            content.setLastSyncAt(LocalDateTime.now());
            Content saved = contentRepository.save(content);

            results.add(SyncResult.builder()
                .localId(entity.getLocalId())
                .serverId(saved.getId())
                .version(saved.getVersion())
                .build());
        }
    }

    public SyncDownloadResponse download(Long userId, SyncDownloadRequest request) {
        if (!CONTENT_ENTITY.equalsIgnoreCase(request.getEntityType())) {
            throw new UnsupportedOperationException("暂不支持该实体类型同步");
        }

        LocalDateTime lastSyncAt = null;
        if (StringUtils.hasText(request.getLastSyncAt())) {
            lastSyncAt = LocalDateTime.from(Instant.parse(request.getLastSyncAt()).atZone(ZoneOffset.UTC));
        }

        List<Content> contents;
        if (lastSyncAt != null) {
            contents = contentRepository.findByUserIdAndUpdatedAtAfter(userId, lastSyncAt);
        } else {
            contents = contentRepository.findByUserId(userId);
        }

        List<ContentResponse> responses = contents.stream()
            .map(contentService::toResponse)
            .toList();

        return SyncDownloadResponse.builder()
            .entities(responses)
            .deleted(List.of())
            .serverTime(Instant.now().toString())
            .build();
    }
}

