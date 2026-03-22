package com.abandonedworld.backend.repository;

import com.abandonedworld.backend.entity.UserInterest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterestRepository extends JpaRepository<UserInterest, Long> {

}