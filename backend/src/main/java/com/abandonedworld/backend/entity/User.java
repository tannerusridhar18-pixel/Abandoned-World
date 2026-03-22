package com.abandonedworld.backend.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String password;
    private String role;
    private String name;
    private String username;
    @Column(length = 500)
    private String bio;
    private String location;
    private String profileImageUrl;
    private String coverImageUrl;
    private LocalDateTime joinDate = LocalDateTime.now();
    public User() {}
    public User(String email, String password, String role) {
        this.email = email; this.password = password; this.role = role;
        this.joinDate = LocalDateTime.now();
    }
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String url) { this.profileImageUrl = url; }
    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String url) { this.coverImageUrl = url; }
    public LocalDateTime getJoinDate() { return joinDate; }
    public void setJoinDate(LocalDateTime joinDate) { this.joinDate = joinDate; }
}
