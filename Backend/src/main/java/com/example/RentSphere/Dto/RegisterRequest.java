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
public class RegisterRequest {

    @NotBlank
    @Email
    @Size(max = 255)
    private String email;

    @NotBlank
    @Size(min = 8, max = 72)
    private String password_hash;

    @NotBlank
    @Size(min = 3, max = 100)
    private String username;

    @NotBlank
    @Size(max = 255)
    private String full_name;

    @Size(max = 20)
    private String mobile_number;

    @Size(max = 500)
    private String avatar_url;
}
