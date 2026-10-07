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
    @Size(max = 180)
    private String email;

    @NotBlank
    @Size(min = 8, max = 72)
    private String password_hash;

    @NotBlank
    @Size(min = 3, max = 100)
    @Pattern(regexp = InputRules.NAME, message = "may only contain letters, digits, spaces and . , ' _ -")
    private String username;

    @NotBlank
    @Size(max = 120)
    @Pattern(regexp = InputRules.NAME, message = "may only contain letters, digits, spaces and . , ' _ -")
    private String full_name;

    @Size(max = 20)
    @Pattern(regexp = InputRules.PHONE, message = "must be a valid phone number")
    private String mobile_number;

    @Size(max = 500)
    @Pattern(regexp = InputRules.IMAGE_URL, message = "must be an https URL")
    private String avatar_url;
}
