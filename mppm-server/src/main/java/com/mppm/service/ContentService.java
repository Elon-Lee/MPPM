package com.mppm.service;

import com.mppm.dto.request.ContentRequest;
import com.mppm.dto.request.ContentUpdateRequest;
import com.mppm.dto.response.ContentResponse;
import com.mppm.dto.response.PageResponse;
import com.mppm.entity.Content;
import com.mppm.repository.ContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;

    public PageResponse<ContentResponse> listContents(Long userId, int page, int size, String status, String keyword) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<Content> resultPage;

        if (StringUtils.hasText(keyword)) {
            resultPage = contentRepository.findByUserIdAndKeyword(userId, keyword, pageable);
        } else if (StringUtils.hasText(status)) {
            resultPage = contentRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            resultPage = contentRepository.findByUserId(userId, pageable);
        }

        return PageResponse.<ContentResponse>builder()
            .data(resultPage.map(this::toResponse).getContent())
            .total(resultPage.getTotalElements())
            .page(page)
            .size(size)
            .build();
    }

    public ContentResponse getContent(Long userId, Long contentId) {
        Content content = contentRepository.findByIdAndUserId(contentId, userId)
            .orElseThrow(() -> new RuntimeException("内容不存在"));
        return toResponse(content);
    }

    @Transactional
    public ContentResponse createContent(Long userId, ContentRequest request) {
        Content content = new Content();
        content.setUserId(userId);
        content.setTitle(request.getTitle());
        content.setContent(request.getContent());
        content.setContentType(request.getContentType());
        content.setStatus(request.getStatus());
        content.setVersion(1);
        content.setLastSyncAt(LocalDateTime.now());

        Content saved = contentRepository.save(content);
        return toResponse(saved);
    }

    @Transactional
    public ContentResponse updateContent(Long userId, Long contentId, ContentUpdateRequest request) {
        Content content = contentRepository.findByIdAndUserId(contentId, userId)
            .orElseThrow(() -> new RuntimeException("内容不存在"));

        if (!request.getVersion().equals(content.getVersion())) {
            throw new RuntimeException("内容版本不一致，请刷新后重试");
        }

        content.setTitle(request.getTitle());
        content.setContent(request.getContent());
        content.setContentType(request.getContentType());
        content.setStatus(request.getStatus());
        content.setVersion(content.getVersion() + 1);
        content.setLastSyncAt(LocalDateTime.now());

        Content saved = contentRepository.save(content);
        return toResponse(saved);
    }

    @Transactional
    public void deleteContent(Long userId, Long contentId) {
        Content content = contentRepository.findByIdAndUserId(contentId, userId)
            .orElseThrow(() -> new RuntimeException("内容不存在"));
        contentRepository.delete(content);
    }

    public ContentResponse toResponse(Content content) {
        return ContentResponse.builder()
            .id(content.getId())
            .title(content.getTitle())
            .content(content.getContent())
            .contentType(content.getContentType())
            .status(content.getStatus())
            .version(content.getVersion())
            .lastSyncAt(content.getLastSyncAt())
            .createdAt(content.getCreatedAt())
            .updatedAt(content.getUpdatedAt())
            .build();
    }
}

