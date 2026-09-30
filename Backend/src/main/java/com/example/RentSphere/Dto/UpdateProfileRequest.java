package com.example.RentSphere.Dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Email
    @Size(max = 255)
    private String email;

    @Size(min = 3, max = 100)
    private String username;

    @Size(max = 255)
    private String full_name;

    @Size(min = 8, max = 72)
    private String password_hash;

    @Size(max = 20)
    private String mobile_number;

    @Size(max = 500)
    private String avatar_url;
}
