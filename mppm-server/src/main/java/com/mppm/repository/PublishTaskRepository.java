package com.mppm.repository;

import com.mppm.entity.PublishTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PublishTaskRepository extends JpaRepository<PublishTask, Long> {

    @Query("SELECT t FROM PublishTask t WHERE t.userId = :userId " +
        "AND (:status IS NULL OR t.status = :status) " +
        "AND (:platformId IS NULL OR t.platform.id = :platformId)")
    Page<PublishTask> search(@Param("userId") Long userId,
                             @Param("status") String status,
                             @Param("platformId") Long platformId,
                             Pageable pageable);
}

