package com.abandonedworld.backend.entity;
import jakarta.persistence.*;
@Entity
@Table(name = "interests")
public class Interest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    //private String email;
    private String interest;
    public Interest() {}
    public Long getId() { return id; }
   // public String getEmail() { return email; }
   // public void setEmail(String email) { this.email = email; }
    public String getInterest() { return interest; }
    public void setInterest(String interest) { this.interest = interest; }
}
