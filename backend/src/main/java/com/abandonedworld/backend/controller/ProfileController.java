package com.abandonedworld.backend.controller;

import com.abandonedworld.backend.entity.User;
import com.abandonedworld.backend.entity.Activity;
import com.abandonedworld.backend.repository.FavoriteRepository;
import com.abandonedworld.backend.repository.ReviewRepository;
import com.abandonedworld.backend.repository.UserRepository;
import com.abandonedworld.backend.repository.ActivityRepository;
import com.abandonedworld.backend.security.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ─── Helper: extract email from Bearer token ──────────────────
    private String emailFromRequest(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) return null;
        return jwtUtil.extractEmail(auth.substring(7));
    }

    // ─── GET PROFILE ──────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> getProfile(HttpServletRequest request) {

        String email = emailFromRequest(request);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = userRepository.findByEmail(email).orElseThrow();

        // Real counts from DB
        long reviewCount   = reviewRepository.countByUserEmail(email);
        long favoritesCount = favoriteRepository.findByUserEmail(email).size();

        Map<String, Object> response = new HashMap<>();
        response.put("name", user.getName());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("bio", user.getBio());
        response.put("location", user.getLocation());
        response.put("joinDate", user.getJoinDate());
        response.put("profileImageUrl", user.getProfileImageUrl());
        response.put("coverImageUrl", user.getCoverImageUrl());

        // Live counts
        response.put("reviewCount", reviewCount);
        response.put("likesCount", favoritesCount);   // favorites = "likes" in this app
        response.put("photosCount", 0);               // extend when photos feature is built
        response.put("placesCount", 0);               // extend when user-submitted places is built

        return ResponseEntity.ok(response);
    }

    // ─── UPDATE PROFILE ───────────────────────────────────────────
    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(HttpServletRequest request,
                                           @RequestBody Map<String, String> data) {

        String email = emailFromRequest(request);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = userRepository.findByEmail(email).orElseThrow();

        if (data.containsKey("name"))     user.setName(data.get("name"));
        if (data.containsKey("username")) user.setUsername(data.get("username"));
        if (data.containsKey("bio"))      user.setBio(data.get("bio"));
        if (data.containsKey("location")) user.setLocation(data.get("location"));

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Profile updated"));
    }

    // ─── CHANGE PASSWORD ──────────────────────────────────────────
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(HttpServletRequest request,
                                            @RequestBody Map<String, String> data) {

        String email = emailFromRequest(request);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = userRepository.findByEmail(email).orElseThrow();

        String currentPassword = data.get("currentPassword");
        String newPassword = data.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing fields"));
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password incorrect"));
        }

        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 8 characters"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password updated"));
    }

    // ─── UPLOAD PROFILE PHOTO ─────────────────────────────────────
    @PostMapping("/upload-photo")
    public ResponseEntity<?> uploadPhoto(HttpServletRequest request,
                                         @RequestParam("file") MultipartFile file) throws Exception {

        String email = emailFromRequest(request);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = userRepository.findByEmail(email).orElseThrow();

        String uploadDir = "uploads/profile/";
        new File(uploadDir).mkdirs();

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        file.transferTo(new File(uploadDir + fileName));

        String imageUrl = "http://localhost:8081/uploads/profile/" + fileName;
        user.setProfileImageUrl(imageUrl);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }

    // ─── UPLOAD COVER PHOTO ───────────────────────────────────────
    @PostMapping("/upload-cover")
    public ResponseEntity<?> uploadCover(HttpServletRequest request,
                                         @RequestParam("file") MultipartFile file) throws Exception {

        String email = emailFromRequest(request);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = userRepository.findByEmail(email).orElseThrow();

        String uploadDir = "uploads/cover/";
        new File(uploadDir).mkdirs();

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        file.transferTo(new File(uploadDir + fileName));

        String imageUrl = "http://localhost:8081/uploads/cover/" + fileName;
        user.setCoverImageUrl(imageUrl);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }

    // ─── GET ACTIVITY ─────────────────────────────────────────────
    @GetMapping("/activity")
    public List<Activity> getActivity(HttpServletRequest request) {

        String email = emailFromRequest(request);
        if (email == null) return List.of();

        User user = userRepository.findByEmail(email).orElseThrow();

        return activityRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    // ─── SAVE SETTINGS ────────────────────────────────────────────
    @PutMapping("/settings")
    public ResponseEntity<?> saveSettings(HttpServletRequest request,
                                          @RequestBody Map<String, Object> settings) {

        String email = emailFromRequest(request);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        // Settings are client-side only for now (no DB columns).
        // Just acknowledge to keep frontend happy.
        return ResponseEntity.ok(Map.of("message", "Settings saved"));
    }

    // ─── EXPORT DATA ──────────────────────────────────────────────
    @GetMapping("/export")
    public ResponseEntity<?> exportData(HttpServletRequest request) {

        String email = emailFromRequest(request);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = userRepository.findByEmail(email).orElseThrow();
        List<?> reviews   = reviewRepository.findByUserEmail(email);
        List<?> favorites = favoriteRepository.findByUserEmail(email);

        Map<String, Object> exportData = new HashMap<>();
        exportData.put("email", user.getEmail());
        exportData.put("name", user.getName());
        exportData.put("reviews", reviews);
        exportData.put("favorites", favorites);

        return ResponseEntity.ok(exportData);
    }

    // ─── DELETE ACCOUNT ───────────────────────────────────────────
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteAccount(HttpServletRequest request) {

        String email = emailFromRequest(request);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = userRepository.findByEmail(email).orElseThrow();

        // Remove dependent records
        favoriteRepository.findByUserEmail(email).forEach(favoriteRepository::delete);
        reviewRepository.findByUserEmail(email).forEach(reviewRepository::delete);

        userRepository.delete(user);

        return ResponseEntity.ok(Map.of("message", "Account deleted"));
    }
}
