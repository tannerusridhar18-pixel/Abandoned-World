package com.abandonedworld.backend.dto;

import java.util.List;

public class InterestRequest {

    private String email;
    private List<String> interests;

    public String getEmail() {
        return email;
    }

    public List<String> getInterests() {
        return interests;
    }
}