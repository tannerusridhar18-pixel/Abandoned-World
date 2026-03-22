package com.abandonedworld.backend.entity;
import jakarta.persistence.*;
@Entity
@Table(name = "favorites")
public class Favorite {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String userEmail;
    private Long placeId;
    public Long getId() { return id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public Long getPlaceId() { return placeId; }
    public void setPlaceId(Long placeId) { this.placeId = placeId; }
}
