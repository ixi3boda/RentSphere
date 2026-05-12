package com.example.RentSphere.integration;

import com.example.RentSphere.Dto.*;
import com.example.RentSphere.SecurityConfig.JwtService;
import com.example.RentSphere.Service.UserService;
import com.example.RentSphere.fixtures.TestFixtures;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Login Workflow Integration Tests")
class LoginWorkflowTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtService jwtService;

    @MockBean private UserService userService;
    @MockBean private org.springframework.security.core.userdetails.UserDetailsService myUserDetailsService;

    @Test
    @DisplayName("POST /login — returns JWT token for valid admin credentials")
    void login_validAdminCredentials_returnsToken() throws Exception {
        LoginRequest req = TestFixtures.validAdminLoginRequest();
        AuthResponse response = AuthResponse.builder().token("admin.mock.token").build();
        when(userService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/user/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("admin.mock.token"));
    }

    @Test
    @DisplayName("POST /login — returns 400 for wrong credentials")
    void login_wrongCredentials_returns400() throws Exception {
        LoginRequest req = TestFixtures.invalidLoginRequest();
        when(userService.login(any())).thenThrow(new IllegalArgumentException("Invalid email or password"));

        mockMvc.perform(post("/api/user/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("POST /register — returns token after successful registration")
    void register_validPayload_returnsToken() throws Exception {
        RegisterRequest req = TestFixtures.validRegisterRequest();
        AuthResponse response = AuthResponse.builder().token("new.user.token").build();
        when(userService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/user/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    @DisplayName("POST /register — 400 for duplicate email")
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

    @Test
    @DisplayName("Authenticated user can call /api/user/me after login")
    void authenticatedUser_canAccessMe() throws Exception {
        String token = jwtService.generateToken("admin@test.com", "ADMIN");
        com.example.RentSphere.Dto.User adminUser = TestFixtures.adminUser();

        org.springframework.security.core.userdetails.UserDetails details =
                org.springframework.security.core.userdetails.User
                        .withUsername("admin@test.com")
                        .password("x").roles("ADMIN").build();
        when(myUserDetailsService.loadUserByUsername("admin@test.com")).thenReturn(details);
        when(userService.getCurrentUser("admin@test.com")).thenReturn(adminUser);

        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@test.com"));
    }
}
