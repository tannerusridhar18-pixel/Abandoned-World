package com.abandonedworld.backend.repository;

import com.abandonedworld.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByPlaceId(Long placeId);

    // Find by userEmail (used in /my and /user endpoints)
    List<Review> findByUserEmail(String userEmail);

    // Find by userId (kept for compatibility)
    List<Review> findByUserId(Long userId);

    // Count by userEmail for profile stats
    long countByUserEmail(String userEmail);
}
