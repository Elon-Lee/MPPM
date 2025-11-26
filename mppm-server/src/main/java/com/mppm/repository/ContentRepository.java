package com.mppm.repository;

import com.mppm.entity.Content;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContentRepository extends JpaRepository<Content, Long> {
    Page<Content> findByUserId(Long userId, Pageable pageable);

    Page<Content> findByUserIdAndStatus(Long userId, String status, Pageable pageable);

    List<Content> findByUserId(Long userId);

    Optional<Content> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT c FROM Content c WHERE c.userId = :userId AND " +
        "(LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
        "LOWER(c.content) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Content> findByUserIdAndKeyword(@Param("userId") Long userId,
                                         @Param("keyword") String keyword,
                                         Pageable pageable);

    List<Content> findByUserIdAndUpdatedAtAfter(Long userId, LocalDateTime updatedAt);
}
