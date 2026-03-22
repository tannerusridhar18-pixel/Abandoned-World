package com.abandonedworld.backend.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name = "activities")
public class Activity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private String type;
    private String description;
    private LocalDateTime createdAt = LocalDateTime.now();
    public Activity() {}
    public Activity(Long userId, String type, String description) {
        this.userId = userId; this.type = type; this.description = description;
        this.createdAt = LocalDateTime.now();
    }
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
