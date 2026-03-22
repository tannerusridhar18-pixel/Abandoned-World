package com.abandonedworld.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "interests")
public class UserInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String interest;

    @ManyToOne
    @JoinColumn(name = "user_id")   // this creates the column
    private User user;

    public Long getId() {
        return id;
    }

    public String getInterest() {
        return interest;
    }

    public void setInterest(String interest) {
        this.interest = interest;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}