package com.abandonedworld.backend.dto;

import java.util.List;

public class RegisterRequest {

    private String email;
    private String password;
    private List<String> interests;

    public RegisterRequest() {}

    public String getEmail() { return email; }

    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }

    public void setPassword(String password) { this.password = password; }

    public List<String> getInterests() { return interests; }

    public void setInterests(List<String> interests) { this.interests = interests; }
}