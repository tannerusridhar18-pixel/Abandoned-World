package com.abandonedworld.backend.controller;

import com.abandonedworld.backend.repository.PlaceRepository;
import com.abandonedworld.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics() {
        long totalPlaces = placeRepository.count();
        long totalUsers = userRepository.count();
        return Map.of(
                "totalPlaces", totalPlaces,
                "totalUsers", totalUsers,
                "pendingSubmissions", 0
        );
    }
}
