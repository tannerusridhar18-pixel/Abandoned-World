package com.abandonedworld.backend.service;

import com.abandonedworld.backend.dto.LoginRequest;
import com.abandonedworld.backend.dto.RegisterRequest;
import com.abandonedworld.backend.entity.User;
import com.abandonedworld.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // ================= REGISTER =================

    public User register(RegisterRequest request) {

        User user = new User();

        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");

        userRepository.save(user);

        // Save interests
        if (request.getInterests() != null) {

            for (String interest : request.getInterests()) {

                jdbcTemplate.update(
                        "INSERT INTO interests(email, interest) VALUES (?, ?)",
                        user.getEmail(),
                        interest
                );

            }
        }

        return user;
    }

    // ================= LOGIN =================

    public Optional<User> login(LoginRequest request) {

        Optional<User> user = userRepository.findByEmail(request.getEmail());

        if (user.isPresent()) {

            if (passwordEncoder.matches(request.getPassword(), user.get().getPassword())) {
                return user;
            }

        }

        return Optional.empty();
    }
}