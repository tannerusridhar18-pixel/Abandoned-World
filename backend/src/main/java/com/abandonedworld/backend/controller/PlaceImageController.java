package com.abandonedworld.backend.controller;

import com.abandonedworld.backend.entity.PlaceImage;
import com.abandonedworld.backend.repository.PlaceImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/place-images")
@CrossOrigin
public class PlaceImageController {

    @Autowired
    private PlaceImageRepository repository;

    @GetMapping("/{placeId}")
    public List<PlaceImage> getImages(@PathVariable Long placeId) {
        return repository.findByPlaceId(placeId);
    }

    @PostMapping
    public PlaceImage addImage(@RequestBody PlaceImage image) {
        return repository.save(image);
    }
}
