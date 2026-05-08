package com.example.RentSphere.services;

import com.example.RentSphere.Dto.*;
import com.example.RentSphere.Repository.UserRepository;
import com.example.RentSphere.SecurityConfig.JwtService;
import com.example.RentSphere.Service.UserService;
import com.example.RentSphere.fixtures.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService.
 * All dependencies (UserRepository, JwtService, PasswordEncoder, AuthenticationManager)
 * are mocked with Mockito — zero Spring context needed.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks private UserService userService;

    private static final String MOCK_TOKEN = "mock.jwt.token";

    @BeforeEach
    void setUp() {
        when(jwtService.generateToken(anyString(), anyString())).thenReturn(MOCK_TOKEN);
    }

    // ── register ───────────────────────────────────────────────────

    @Test
    @DisplayName("register — success returns AuthResponse with token")
    void register_success_returnsToken() {
        RegisterRequest req = TestFixtures.validRegisterRequest();
        when(userRepository.existsByEmail(req.getEmail().trim().toLowerCase())).thenReturn(false);
        when(userRepository.existsByUsername(req.getUsername().trim())).thenReturn(false);
        when(passwordEncoder.encode(req.getPassword_hash())).thenReturn("encoded");

        AuthResponse result = userService.register(req);

        assertThat(result.getToken()).isEqualTo(MOCK_TOKEN);
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register — assigns VISITOR role by default")
    void register_assignsVisitorRole() {
        RegisterRequest req = TestFixtures.validRegisterRequest();
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        userService.register(req);
        verify(userRepository).save(captor.capture());

        assertThat(captor.getValue().getRole_name()).isEqualTo("VISITOR");
    }

    @Test
    @DisplayName("register — null request throws IllegalArgumentException")
    void register_nullRequest_throwsIllegalArgument() {
        assertThatThrownBy(() -> userService.register(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("required");
    }

    @Test
    @DisplayName("register — missing email throws IllegalArgumentException")
    void register_missingEmail_throwsIllegalArgument() {
        RegisterRequest req = TestFixtures.validRegisterRequest();
        req.setEmail(null);
        assertThatThrownBy(() -> userService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email is required");
    }

    @Test
    @DisplayName("register — blank email throws IllegalArgumentException")
    void register_blankEmail_throwsIllegalArgument() {
        RegisterRequest req = TestFixtures.validRegisterRequest();
        req.setEmail("  ");
        assertThatThrownBy(() -> userService.register(req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("register — missing password throws IllegalArgumentException")
    void register_missingPassword_throwsIllegalArgument() {
        RegisterRequest req = TestFixtures.validRegisterRequest();
        req.setPassword_hash(null);
        assertThatThrownBy(() -> userService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Password is required");
    }

    @Test
    @DisplayName("register — missing username throws IllegalArgumentException")
    void register_missingUsername_throwsIllegalArgument() {
        RegisterRequest req = TestFixtures.validRegisterRequest();
        req.setUsername(null);
        assertThatThrownBy(() -> userService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username is required");
    }

    @Test
    @DisplayName("register — duplicate email throws IllegalArgumentException")
    void register_duplicateEmail_throwsIllegalArgument() {
        RegisterRequest req = TestFixtures.validRegisterRequest();
        when(userRepository.existsByEmail(anyString())).thenReturn(true);
        assertThatThrownBy(() -> userService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email is already in use");
    }

    @Test
    @DisplayName("register — duplicate username throws IllegalArgumentException")
    void register_duplicateUsername_throwsIllegalArgument() {
        RegisterRequest req = TestFixtures.validRegisterRequest();
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(true);
        assertThatThrownBy(() -> userService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username is already in use");
    }

    @Test
    @DisplayName("register — email is normalized to lowercase")
    void register_normalizesEmailToLowercase() {
        RegisterRequest req = TestFixtures.validRegisterRequest();
        req.setEmail("UPPER@Test.COM");
        when(userRepository.existsByEmail("upper@test.com")).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        userService.register(req);
        verify(userRepository).save(captor.capture());

        assertThat(captor.getValue().getEmail()).isEqualTo("upper@test.com");
    }

    // ── login ──────────────────────────────────────────────────────

    @Test
    @DisplayName("login — valid credentials returns token")
    void login_validCredentials_returnsToken() {
        LoginRequest req = TestFixtures.validTenantLoginRequest();
        User user = TestFixtures.tenantUser();
        when(userRepository.findByEmail("tenant@test.com")).thenReturn(Optional.of(user));

        AuthResponse result = userService.login(req);

        assertThat(result.getToken()).isEqualTo(MOCK_TOKEN);
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("login — sets user active on success")
    void login_setsUserActive() {
        LoginRequest req = TestFixtures.validTenantLoginRequest();
        User user = TestFixtures.tenantUser();
        when(userRepository.findByEmail("tenant@test.com")).thenReturn(Optional.of(user));

        userService.login(req);

        verify(userRepository).updateActiveState(user.getUser_id(), true);
    }

    @Test
    @DisplayName("login — null request throws IllegalArgumentException")
    void login_nullRequest_throws() {
        assertThatThrownBy(() -> userService.login(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("login — wrong credentials (auth fails) throws IllegalArgumentException")
    void login_wrongCredentials_throwsIllegalArgument() {
        LoginRequest req = TestFixtures.invalidLoginRequest();
        doThrow(BadCredentialsException.class)
                .when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> userService.login(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid email or password");
    }

    // ── getCurrentUser ─────────────────────────────────────────────

    @Test
    @DisplayName("getCurrentUser — returns user by email")
    void getCurrentUser_returnsUser() {
        User user = TestFixtures.adminUser();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(user));

        User result = userService.getCurrentUser("admin@test.com");
        assertThat(result.getEmail()).isEqualTo("admin@test.com");
    }

    @Test
    @DisplayName("getCurrentUser — unknown email throws RuntimeException")
    void getCurrentUser_unknownEmail_throws() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.getCurrentUser("ghost@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    // ── updateCurrentUser ──────────────────────────────────────────

    @Test
    @DisplayName("updateCurrentUser — null request throws IllegalArgumentException")
    void updateCurrentUser_nullRequest_throws() {
        assertThatThrownBy(() -> userService.updateCurrentUser("admin@test.com", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("payload is required");
    }

    @Test
    @DisplayName("updateCurrentUser — duplicate username throws IllegalArgumentException")
    void updateCurrentUser_duplicateUsername_throws() {
        User user = TestFixtures.adminUser();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(user));
        when(userRepository.existsByUsername("takenname")).thenReturn(true);

        UpdateProfileRequest req = UpdateProfileRequest.builder().username("takenname").build();
        assertThatThrownBy(() -> userService.updateCurrentUser("admin@test.com", req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username is already in use");
    }

    @Test
    @DisplayName("updateCurrentUser — blank username throws IllegalArgumentException")
    void updateCurrentUser_blankUsername_throws() {
        User user = TestFixtures.adminUser();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(user));

        UpdateProfileRequest req = UpdateProfileRequest.builder().username("   ").build();
        assertThatThrownBy(() -> userService.updateCurrentUser("admin@test.com", req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username cannot be blank");
    }

    @Test
    @DisplayName("updateCurrentUser — success returns new token")
    void updateCurrentUser_success_returnsNewToken() {
        User user = TestFixtures.adminUser();
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(user));

        UpdateProfileRequest req = UpdateProfileRequest.builder().full_name("New Name").build();
        UpdateProfileResponse response = userService.updateCurrentUser("admin@test.com", req);

        assertThat(response.getToken()).isEqualTo(MOCK_TOKEN);
        verify(userRepository).update(any(User.class));
    }

    // ── logout ─────────────────────────────────────────────────────

    @Test
    @DisplayName("logout — sets user inactive")
    void logout_setsUserInactive() {
        User user = TestFixtures.tenantUser();
        when(userRepository.findByEmail("tenant@test.com")).thenReturn(Optional.of(user));

        userService.logout("tenant@test.com");

        verify(userRepository).updateActiveState(user.getUser_id(), false);
    }
}
