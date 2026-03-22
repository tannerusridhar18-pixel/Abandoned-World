package com.abandonedworld.backend.repository;
import com.abandonedworld.backend.entity.PlaceImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PlaceImageRepository extends JpaRepository<PlaceImage, Long> {
    List<PlaceImage> findByPlaceId(Long placeId);
}
