package com.example.RentSphere.security;

import com.example.RentSphere.SecurityConfig.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;
import static org.assertj.core.api.Assertions.assertThat;


@DisplayName("JwtService Unit Tests")
class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
    }

    

    @Test
    @DisplayName("generateToken returns a non-blank token string")
    void generateToken_returnsNonBlankToken() {
        String token = jwtService.generateToken("admin@test.com", "ADMIN");
        assertThat(token).isNotBlank();
    }

    @Test
    @DisplayName("generateToken encodes email as subject")
    void generateToken_subjectIsEmail() {
        String token = jwtService.generateToken("user@test.com", "TENANT");
        String extracted = jwtService.extractUsername(token);
        assertThat(extracted).isEqualTo("user@test.com");
    }

    @Test
    @DisplayName("generateToken includes role claim")
    void generateToken_includesRoleClaim() {
        String token = jwtService.generateToken("admin@test.com", "ADMIN");
        
        String role = jwtService.extractClaim(token, claims -> claims.get("role", String.class));
        assertThat(role).isEqualTo("ADMIN");
    }

    

    @Test
    @DisplayName("isTokenValid returns true for correct username")
    void isTokenValid_trueForMatchingUsername() {
        String token = jwtService.generateToken("user@test.com", "TENANT");
        assertThat(jwtService.isTokenValid(token, "user@test.com")).isTrue();
    }

    @Test
    @DisplayName("isTokenValid returns false for wrong username")
    void isTokenValid_falseForWrongUsername() {
        String token = jwtService.generateToken("user@test.com", "TENANT");
        assertThat(jwtService.isTokenValid(token, "other@test.com")).isFalse();
    }

    @Test
    @DisplayName("extractUsername correctly parses subject from token")
    void extractUsername_parsesSubjectCorrectly() {
        String email = "test@rentsphere.com";
        String token = jwtService.generateToken(email, "VISITOR");
        assertThat(jwtService.extractUsername(token)).isEqualTo(email);
    }

    @Test
    @DisplayName("token generated for ADMIN role is valid for ADMIN email")
    void adminToken_isValidForAdminEmail() {
        String token = jwtService.generateToken("admin@test.com", "ADMIN");
        assertThat(jwtService.isTokenValid(token, "admin@test.com")).isTrue();
    }

    @Test
    @DisplayName("token generated for different roles have different role claims")
    void differentRoles_differentClaims() {
        String adminToken = jwtService.generateToken("a@t.com", "ADMIN");
        String tenantToken = jwtService.generateToken("b@t.com", "TENANT");
        String visitorToken = jwtService.generateToken("c@t.com", "VISITOR");

        assertThat((String) jwtService.extractClaim(adminToken, c -> c.get("role", String.class))).isEqualTo("ADMIN");
        assertThat((String) jwtService.extractClaim(tenantToken, c -> c.get("role", String.class))).isEqualTo("TENANT");
        assertThat((String) jwtService.extractClaim(visitorToken, c -> c.get("role", String.class))).isEqualTo("VISITOR");
    }

    @Test
    @DisplayName("malformed token throws exception on parse")
    void malformedToken_throwsException() {
        assertThatThrownBy(() -> jwtService.extractUsername("this.is.not.a.jwt"))
                .isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("empty token throws exception on parse")
    void emptyToken_throwsException() {
        assertThatThrownBy(() -> jwtService.extractUsername(""))
                .isInstanceOf(Exception.class);
    }
}
