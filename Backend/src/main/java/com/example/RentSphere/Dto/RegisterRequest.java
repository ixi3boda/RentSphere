package com.example.RentSphere.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    private String email;
    private String password_hash;
    private String username;
    private String full_name;
    private String mobile_number;
    private String avatar_url;

}
