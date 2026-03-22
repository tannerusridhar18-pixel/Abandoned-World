package com.abandonedworld.backend.controller;

import com.abandonedworld.backend.entity.Activity;
import com.abandonedworld.backend.entity.Place;
import com.abandonedworld.backend.entity.Review;
import com.abandonedworld.backend.entity.User;
import com.abandonedworld.backend.repository.ActivityRepository;
import com.abandonedworld.backend.repository.PlaceRepository;
import com.abandonedworld.backend.repository.ReviewRepository;
import com.abandonedworld.backend.repository.UserRepository;
import com.abandonedworld.backend.security.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // ─── ADD REVIEW ───────────────────────────────────────────────
    // Extracts userEmail from JWT so the frontend doesn't need to send it
    @PostMapping
    public Review addReview(@RequestBody Review review,
                            HttpServletRequest request) {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);

            // Always set email from JWT (never trust client-supplied email)
            review.setUserEmail(email);

            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                review.setUserId(user.getId());

                // Log activity
                Activity activity = new Activity();
                activity.setUserId(user.getId());
                activity.setType("Review");
                activity.setDescription("Posted a new review");
                activityRepository.save(activity);
            }
        }

        review.setCreatedAt(LocalDateTime.now());

        return reviewRepository.save(review);
    }

    // ─── GET REVIEWS BY PLACE ─────────────────────────────────────
    @GetMapping("/place/{placeId}")
    public List<Review> getReviews(@PathVariable Long placeId) {
        return reviewRepository.findByPlaceId(placeId);
    }

    // ─── DELETE REVIEW ────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public void deleteReview(@PathVariable Long id) {
        reviewRepository.deleteById(id);
    }

    // ─── GET MY REVIEWS (used by profile.js) ─────────────────────
    // Supports optional ?sort= query param: recent | oldest | rating
    @GetMapping("/my")
    public List<Review> getMyReviews(HttpServletRequest request,
                                     @RequestParam(value = "sort", defaultValue = "recent") String sort) {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return List.of();
        }

        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);

        List<Review> reviews = reviewRepository.findByUserEmail(email);

        // Sort
        switch (sort) {
            case "oldest":
                reviews.sort((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return a.getCreatedAt().compareTo(b.getCreatedAt());
                });
                break;
            case "rating":
                reviews.sort((a, b) -> Integer.compare(b.getRating(), a.getRating()));
                break;
            case "recent":
            default:
                reviews.sort((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                });
                break;
        }

        // Enrich each review with placeName so the profile UI can display it
        reviews.forEach(r -> {
            if (r.getPlaceId() != null) {
                placeRepository.findById(r.getPlaceId()).ifPresent(place ->
                        r.setPlaceName(place.getName())
                );
            }
        });

        return reviews;
    }

    // ─── GET USER REVIEWS (alias used by older profile.js code) ──
    @GetMapping("/user")
    public List<Review> getUserReviews(HttpServletRequest request) {
        return getMyReviews(request, "recent");
    }
}
