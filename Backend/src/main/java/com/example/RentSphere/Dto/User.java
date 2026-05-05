package com.example.RentSphere.Dto;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    private int user_id;

    private String email;

    private String password_hash;

    private String username;

    private String role_name;

    private String full_name;

    private String avatar_url;

    private String mobile_number;

    private boolean is_active;

    private LocalDateTime created_at;

    private LocalDateTime updated_at;
}
