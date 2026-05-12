package com.example.RentSphere.helpers;

import com.example.RentSphere.SecurityConfig.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;


@Component
public class JwtTestHelper {

    @Autowired
    private JwtService jwtService;

    public String adminToken() {
        return jwtService.generateToken("admin@test.com", "ADMIN");
    }

    public String tenantToken() {
        return jwtService.generateToken("tenant@test.com", "TENANT");
    }

    public String visitorToken() {
        return jwtService.generateToken("visitor@test.com", "VISITOR");
    }

    public String tokenFor(String email, String role) {
        return jwtService.generateToken(email, role);
    }

    public String bearerAdmin() {
        return "Bearer " + adminToken();
    }

    public String bearerTenant() {
        return "Bearer " + tenantToken();
    }

    public String bearerVisitor() {
        return "Bearer " + visitorToken();
    }
}
