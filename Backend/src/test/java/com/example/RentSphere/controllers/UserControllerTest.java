package com.example.RentSphere.controllers;

import com.example.RentSphere.Dto.*;
import com.example.RentSphere.Service.UserService;
import com.example.RentSphere.SecurityConfig.JwtService;
import com.example.RentSphere.fixtures.TestFixtures;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

/**
 * MockMvc controller tests for UserController.
 * Uses @WebMvcTest to load only the web layer.
 * UserService is fully mocked.
 */
@WebMvcTest(com.example.RentSphere.Controller.UserController.class)
@DisplayName("UserController MockMvc Tests")
class UserControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private UserService userService;
    @MockBean private JwtService jwtService;
    // MyUserDetailsService is needed by security filter chain
    @MockBean private com.example.RentSphere.Service.MyUserDetailsService myUserDetailsService;

    // ── POST /api/user/register ────────────────────────────────────

    @Test
    @DisplayName("POST /register — 200 with valid payload")
    void register_validPayload_returns200() throws Exception {
        RegisterRequest req = TestFixtures.validRegisterRequest();
        AuthResponse response = AuthResponse.builder().token("mock.token").build();
        when(userService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/user/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock.token"));
    }

    @Test
    @DisplayName("POST /register — 400 when email is duplicate")
    void register_duplicateEmail_returns400() throws Exception {
        RegisterRequest req = TestFixtures.validRegisterRequest();
        when(userService.register(any())).thenThrow(new IllegalArgumentException("Email is already in use"));

        mockMvc.perform(post("/api/user/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is already in use"));
    }

    // ── POST /api/user/login ───────────────────────────────────────

    @Test
    @DisplayName("POST /login — 200 with valid credentials")
    void login_validCredentials_returns200() throws Exception {
        LoginRequest req = TestFixtures.validTenantLoginRequest();
        AuthResponse response = AuthResponse.builder().token("tenant.token").build();
        when(userService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/user/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    @DisplayName("POST /login — 400 for invalid credentials")
    void login_invalidCredentials_returns400() throws Exception {
        LoginRequest req = TestFixtures.invalidLoginRequest();
        when(userService.login(any())).thenThrow(new IllegalArgumentException("Invalid email or password"));

        mockMvc.perform(post("/api/user/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    // ── GET /api/user/me ───────────────────────────────────────────

    @Test
    @DisplayName("GET /me — 200 for authenticated user")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void getMe_authenticated_returns200() throws Exception {
        User user = TestFixtures.tenantUser();
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(user);

        mockMvc.perform(get("/api/user/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("tenant@test.com"));
    }

    @Test
    @DisplayName("GET /me — 401 for unauthenticated request")
    void getMe_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/user/me"))
                .andExpect(status().isUnauthorized());
    }

    // ── PUT /api/user/me ───────────────────────────────────────────

    @Test
    @DisplayName("PUT /me — 200 for authenticated user with valid payload")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void updateMe_authenticated_returns200() throws Exception {
        UpdateProfileRequest req = UpdateProfileRequest.builder().full_name("New Name").build();
        UpdateProfileResponse response = UpdateProfileResponse.builder()
                .user(TestFixtures.adminUser())
                .token("new.token")
                .build();
        when(userService.updateCurrentUser(eq("admin@test.com"), any())).thenReturn(response);

        mockMvc.perform(put("/api/user/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("new.token"));
    }

    @Test
    @DisplayName("PUT /me — 400 when username already in use")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void updateMe_duplicateUsername_returns400() throws Exception {
        UpdateProfileRequest req = UpdateProfileRequest.builder().username("taken").build();
        when(userService.updateCurrentUser(anyString(), any()))
                .thenThrow(new IllegalArgumentException("Username is already in use"));

        mockMvc.perform(put("/api/user/me")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Username is already in use"));
    }

    // ── POST /api/user/logout ──────────────────────────────────────

    @Test
    @DisplayName("POST /logout — 200 for authenticated user")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void logout_authenticated_returns200() throws Exception {
        doNothing().when(userService).logout("tenant@test.com");

        mockMvc.perform(post("/api/user/logout").with(csrf()))
                .andExpect(status().isOk());
        verify(userService).logout("tenant@test.com");
    }
}
