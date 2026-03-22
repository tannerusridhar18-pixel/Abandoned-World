package com.abandonedworld.backend.controller;

import com.abandonedworld.backend.entity.Activity;
import com.abandonedworld.backend.entity.Favorite;
import com.abandonedworld.backend.entity.User;
import com.abandonedworld.backend.repository.ActivityRepository;
import com.abandonedworld.backend.repository.FavoriteRepository;
import com.abandonedworld.backend.repository.UserRepository;
import com.abandonedworld.backend.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/favorites")
@CrossOrigin
public class FavoriteController {

    @Autowired private FavoriteRepository favoriteRepository;
    @Autowired private ActivityRepository activityRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;

    @PostMapping
    public String toggleFavorite(@RequestBody Favorite favorite, HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return "Unauthorized";
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        Optional<Favorite> existing = favoriteRepository.findByUserEmailAndPlaceId(email, favorite.getPlaceId());
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return "Removed from favorites";
        }
        favorite.setUserEmail(email);
        favoriteRepository.save(favorite);
        User user = userRepository.findByEmail(email).orElseThrow();
        Activity activity = new Activity();
        activity.setUserId(user.getId());
        activity.setType("Favorite");
        activity.setDescription("Added a place to favorites");
        activityRepository.save(activity);
        return "Added to favorites";
    }

    @GetMapping
    public List<Favorite> getFavorites(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return List.of();
        String email = jwtUtil.extractEmail(authHeader.substring(7));
        return favoriteRepository.findByUserEmail(email);
    }

    @DeleteMapping("/{id}")
    public void deleteFavorite(@PathVariable Long id) {
        favoriteRepository.deleteById(id);
    }
}
