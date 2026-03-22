package com.abandonedworld.backend.entity;
import jakarta.persistence.*;
@Entity
@Table(name = "place_images")
public class PlaceImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "place_id")
    private Long placeId;
    @Column(name = "image_url")
    private String imageUrl;
    public Long getId() { return id; }
    public Long getPlaceId() { return placeId; }
    public void setPlaceId(Long placeId) { this.placeId = placeId; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
