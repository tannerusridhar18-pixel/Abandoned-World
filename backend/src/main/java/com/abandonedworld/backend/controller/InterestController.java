package com.abandonedworld.backend.controller;

import com.abandonedworld.backend.dto.InterestRequest;
import com.abandonedworld.backend.entity.User;
import com.abandonedworld.backend.entity.UserInterest;
import com.abandonedworld.backend.repository.InterestRepository;
import com.abandonedworld.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interests")
@CrossOrigin(origins = "*")
public class InterestController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InterestRepository interestRepository;

    @PostMapping
public String saveInterests(@RequestBody InterestRequest request) {

    System.out.println("EMAIL RECEIVED: " + request.getEmail());
    System.out.println("INTERESTS RECEIVED: " + request.getInterests());

    User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

    System.out.println("USER FOUND ID: " + user.getId());

    for (String interest : request.getInterests()) {

        UserInterest ui = new UserInterest();
        ui.setInterest(interest);
        ui.setUser(user);

        interestRepository.save(ui);
    }

    return "Interests saved";
}
}