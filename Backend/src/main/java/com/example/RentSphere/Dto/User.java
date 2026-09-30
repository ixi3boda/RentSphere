package com.example.RentSphere.Dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    // Accepted on the way in so the same DTO can carry a password, never written to a response.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
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
