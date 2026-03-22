package com.abandonedworld.backend.controller;

import com.abandonedworld.backend.dto.LoginRequest;
import com.abandonedworld.backend.dto.RegisterRequest;
import com.abandonedworld.backend.entity.User;
import com.abandonedworld.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.abandonedworld.backend.security.JwtUtil;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        User user = authService.register(request);
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "role", user.getRole(),
                "email", user.getEmail(),
                "success", true
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> user = authService.login(request);
        if (user.isPresent()) {
            String token = jwtUtil.generateToken(user.get().getEmail(), user.get().getRole());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "role", user.get().getRole(),
                    "email", user.get().getEmail()
            ));
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }
}
