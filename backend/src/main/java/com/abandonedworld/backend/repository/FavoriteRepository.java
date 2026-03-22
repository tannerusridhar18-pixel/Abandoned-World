package com.abandonedworld.backend.repository;
import com.abandonedworld.backend.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserEmail(String userEmail);
    Optional<Favorite> findByUserEmailAndPlaceId(String userEmail, Long placeId);
}
