package com.example.RentSphere.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String email;
    private String username;
    private String full_name;
    private String password_hash;
    private String mobile_number;
    private String avatar_url;
}
