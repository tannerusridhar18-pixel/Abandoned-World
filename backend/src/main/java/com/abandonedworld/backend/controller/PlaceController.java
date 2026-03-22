package com.abandonedworld.backend.controller;

import com.abandonedworld.backend.security.JwtUtil;
import com.abandonedworld.backend.entity.Place;
import com.abandonedworld.backend.repository.PlaceRepository;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.abandonedworld.backend.repository.UserRepository;
import com.abandonedworld.backend.entity.User;

import java.util.List;

@RestController
@RequestMapping("/api/places")
@CrossOrigin(origins = "*")
public class PlaceController {

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public List<Place> getAllPlaces() {
        return placeRepository.findAll();
    }

    @GetMapping("/{id}")
    public Place getPlace(@PathVariable Long id) {
        return placeRepository.findById(id).orElse(null);
    }

    @PostMapping
    public Place addPlace(@RequestBody Place place) {
        return placeRepository.save(place);
    }

    @PutMapping("/{id}")
    public Place updatePlace(@PathVariable Long id, @RequestBody Place updatedPlace) {

        Place place = placeRepository.findById(id).orElse(null);
        if (place == null) return null;

        place.setName(updatedPlace.getName());
        place.setCategory(updatedPlace.getCategory());
        place.setLocation(updatedPlace.getLocation());
        place.setLatitude(updatedPlace.getLatitude());
        place.setLongitude(updatedPlace.getLongitude());
        place.setDescription(updatedPlace.getDescription());
        place.setImage(updatedPlace.getImage());

        return placeRepository.save(place);
    }

    @DeleteMapping("/{id}")
    public void deletePlace(@PathVariable Long id) {
        placeRepository.deleteById(id);
    }

    @GetMapping("/search")
    public List<Place> searchPlaces(@RequestParam String q) {

        List<Place> byName = placeRepository.findByNameContainingIgnoreCase(q);
        byName.addAll(placeRepository.findByCategoryContainingIgnoreCase(q));
        byName.addAll(placeRepository.findByLocationContainingIgnoreCase(q));

        return byName;
    }

    @GetMapping("/category/{category}")
    public List<Place> getByCategory(@PathVariable String category) {
        return placeRepository.findByCategoryContainingIgnoreCase(category);
    }

    @GetMapping("/location/{location}")
    public List<Place> getByLocation(@PathVariable String location) {
        return placeRepository.findByLocationContainingIgnoreCase(location);
    }

    @GetMapping("/recommended")
public List<Place> getRecommendedPlaces(HttpServletRequest request){

    String authHeader = request.getHeader("Authorization");

    if(authHeader == null || !authHeader.startsWith("Bearer ")){
        return placeRepository.findAll();
    }

    String token = authHeader.substring(7);
    String email = jwtUtil.extractEmail(token);

    User user = userRepository.findByEmail(email).orElse(null);

    if(user == null){
        return placeRepository.findAll();
    }

    return placeRepository.getRecommendedPlaces(user.getId());
}

    @Autowired
    private UserRepository userRepository;
}