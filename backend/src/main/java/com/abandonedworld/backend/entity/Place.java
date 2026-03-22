package com.abandonedworld.backend.entity;
import jakarta.persistence.*;
@Entity
@Table(name = "places")
public class Place {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String category;
    private String location;
    private double latitude;
    private double longitude;
    @Column(length = 2000)
    private String description;
    private String image;
    public Place() {}
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
}
