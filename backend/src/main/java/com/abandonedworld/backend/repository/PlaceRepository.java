package com.abandonedworld.backend.repository;
import com.abandonedworld.backend.entity.Place;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
public interface PlaceRepository extends JpaRepository<Place, Long> {
    List<Place> findByNameContainingIgnoreCase(String name);
    List<Place> findByCategoryContainingIgnoreCase(String category);
    List<Place> findByLocationContainingIgnoreCase(String location);

  @Query(value = """
SELECT DISTINCT p.*
FROM places p
JOIN interests i
ON LOWER(i.interest) LIKE CONCAT('%', LOWER(p.category), '%')
WHERE i.user_id = :userId
""", nativeQuery = true)
List<Place> getRecommendedPlaces(@Param("userId") Long userId);
  
}