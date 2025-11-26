package com.mppm.repository;

import com.mppm.entity.PlatformAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlatformAccountRepository extends JpaRepository<PlatformAccount, Long> {
    @Query("SELECT pa FROM PlatformAccount pa " +
        "WHERE pa.userId = :userId " +
        "AND (:platformId IS NULL OR pa.platform.id = :platformId) " +
        "AND (:keyword IS NULL OR :keyword = '' OR " +
        "LOWER(pa.accountName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<PlatformAccount> search(@Param("userId") Long userId,
                                 @Param("platformId") Long platformId,
                                 @Param("keyword") String keyword);
}

