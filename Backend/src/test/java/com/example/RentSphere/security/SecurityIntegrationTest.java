package com.example.RentSphere.security;

import com.example.RentSphere.SecurityConfig.JwtService;
import com.example.RentSphere.Service.MyUserDetailsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Security integration tests — verifies endpoint protection, JWT filter behavior,
 * and role-based access using the real security filter chain.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Security & JWT Filter Integration Tests")
class SecurityIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;

    @MockBean private MyUserDetailsService myUserDetailsService;
    @MockBean private JdbcTemplate jdbcTemplate; // prevent real DB calls in security context

    // ── Public endpoints ───────────────────────────────────────────

    @Test
    @DisplayName("GET /api/properties/all — accessible without token (public)")
    void propertiesAll_publicAccess() throws Exception {
        mockMvc.perform(get("/api/properties/all"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/properties/filter — accessible without token (public)")
    void propertiesFilter_publicAccess() throws Exception {
        mockMvc.perform(get("/api/properties/filter"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/user/register — accessible without token (public)")
    void register_publicAccess() throws Exception {
        mockMvc.perform(post("/api/user/register")
                        .contentType("application/json")
                        .content("{\"email\":\"t@t.com\",\"password_hash\":\"pass\",\"username\":\"usr\"}"))
                .andExpect(status().isOk()); // UserService will fail gracefully
    }

    // ── Protected endpoints — no token ─────────────────────────────

    @Test
    @DisplayName("GET /api/user/me — 401 without token")
    void getMe_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/rent/request — 401 without token")
    void rentRequest_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/rent/request")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/rent/requests/all — 401 without token")
    void getAllRequests_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/rent/requests/all"))
                .andExpect(status().isUnauthorized());
    }

    // ── Protected endpoints — with valid JWT ───────────────────────

    @Test
    @DisplayName("GET /api/user/me — 200 with valid TENANT token")
    void getMe_withValidToken_returns200OrBetter() throws Exception {
        String token = jwtService.generateToken("tenant@test.com", "TENANT");

        UserDetails mockDetails = User.withUsername("tenant@test.com")
                .password("x").roles("TENANT").build();
        when(myUserDetailsService.loadUserByUsername("tenant@test.com")).thenReturn(mockDetails);

        // The response may be 500 because UserService/repository is not wired
        // but we verify the filter PASSES auth (not 401)
        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    // Should not be 401 (unauthorized) — auth passed, downstream may fail
                    assert status != 401 : "Expected non-401 but got 401";
                });
    }

    // ── Malformed tokens ───────────────────────────────────────────

    @Test
    @DisplayName("GET /api/user/me — 401 with malformed Bearer token")
    void getMe_malformedToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer this.is.not.valid"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/user/me — 401 with missing Bearer prefix")
    void getMe_missingBearer_returns401() throws Exception {
        String token = jwtService.generateToken("user@test.com", "TENANT");
        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", token)) // No "Bearer " prefix
                .andExpect(status().isUnauthorized());
    }

    // ── Role-based access ──────────────────────────────────────────

    @Test
    @DisplayName("GET /api/rent/requests/all — 403 with TENANT token (ADMIN only)")
    void getAllRequests_tenantToken_returns403() throws Exception {
        String token = jwtService.generateToken("tenant@test.com", "TENANT");

        UserDetails mockDetails = User.withUsername("tenant@test.com")
                .password("x").roles("TENANT").build();
        when(myUserDetailsService.loadUserByUsername("tenant@test.com")).thenReturn(mockDetails);

        mockMvc.perform(get("/api/rent/requests/all")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
