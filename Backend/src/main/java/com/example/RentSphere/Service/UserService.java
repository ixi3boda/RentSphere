package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.*;
import com.example.RentSphere.Repository.UserRepository;
import com.example.RentSphere.SecurityConfig.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Locale;

/**
 * Business-logic layer for user identity operations.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Registration - normalises the email/username, checks for duplicates, encodes the
 *       password with BCrypt, persists the user, and returns a JWT so the caller is
 *       immediately authenticated.</li>
 *   <li>Login - delegates credential verification to Spring Security's
 *       {@link org.springframework.security.authentication.AuthenticationManager} and then
 *       generates a fresh JWT embedding the user's role.</li>
 *   <li>Profile management - partial updates; if the email changes, a new JWT is returned
 *       so the caller does not need to re-login.</li>
 *   <li>Logout - marks {@code is_active = FALSE} as an application-level deactivation
 *       signal (tokens remain valid until expiry).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;


    /**
     * Registers a new user account. The role is always {@code VISITOR}; promotion
     * to {@code TENANT} or {@code ADMIN} is an operator action.
     *
     * @param request the registration payload (email, password, username, etc.)
     * @return an {@link AuthResponse} containing a signed JWT for immediate use
     * @throws IllegalArgumentException if required fields are missing, the email is already
     *         registered, or the username is already taken
     */
    public AuthResponse register(RegisterRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request payload is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getPassword_hash() == null || request.getPassword_hash().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
        String normalizedUsername = request.getUsername().trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email is already in use");
        }
        if (userRepository.existsByUsername(normalizedUsername)) {
            throw new IllegalArgumentException("Username is already in use");
        }

        User user = User.builder()
                .email(normalizedEmail)
                .password_hash(passwordEncoder.encode(request.getPassword_hash()))
                .username(normalizedUsername)
                .full_name(request.getFull_name())
                .avatar_url(request.getAvatar_url())
                .created_at(LocalDateTime.now())
                .updated_at(LocalDateTime.now())
                .mobile_number(request.getMobile_number())
                .role_name("VISITOR")
                .is_active(true)
                .build();
        userRepository.save(user);
        String token = jwtService.generateToken(user.getEmail(),"VISITOR");
        return AuthResponse.builder().token(token).build();
    }

    /**
     * Authenticates a user by email and password and returns a fresh JWT.
     *
     * <p>Credential verification is delegated to Spring Security's
     * {@link org.springframework.security.authentication.AuthenticationManager}, which
     * in turn calls the BCrypt encoder. On success, {@code is_active} is set to
     * {@code TRUE} and the user's current role is embedded in the token.
     *
     * @param request login payload (email + password)
     * @return an {@link AuthResponse} containing a signed JWT
     * @throws IllegalArgumentException if the credentials are invalid
     */
    public AuthResponse login(LoginRequest request) {
        if (request == null || request.getEmail() == null || request.getPassword_hash() == null) {
            throw new IllegalArgumentException("Email and password are required");
        }
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            request.getPassword_hash()
                    )
            );
        } catch (AuthenticationException ex) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid email or password")
                )
                ;
        String token = jwtService.generateToken(email,user.getRole_name());
        userRepository.updateActiveState(user.getUser_id(), true);
        return AuthResponse.builder().token(token).build();
    }

    /**
     * Loads the full {@link User} entity for the given email. Used by controllers to
     * resolve the authenticated principal to a database record.
     *
     * @param email the user's email address (normalised to lower-case)
     * @return the matching {@link User}
     * @throws RuntimeException if no user with the given email exists
     */
    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email).orElseThrow(() ->
                new RuntimeException("User not found with email: " + email)
        );
    }

    /**
     * Applies a partial update to the authenticated user's profile.
     * Only non-null fields in {@code request} are persisted.
     *
     * <p>If the email changes, the new email is checked for uniqueness before being
     * applied. A fresh JWT is always returned so the caller's token remains valid
     * regardless of whether the email (the JWT subject) changed.
     *
     * @param currentEmail the user's current email, sourced from the JWT principal
     * @param request      partial update payload
     * @return an {@link UpdateProfileResponse} containing the updated user and a new JWT
     * @throws IllegalArgumentException if the new email or username is already in use
     */
    public UpdateProfileResponse updateCurrentUser(String currentEmail, UpdateProfileRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Update payload is required");
        }
        User user = getCurrentUser(currentEmail);

        if (request.getFull_name() != null) {
            user.setFull_name(request.getFull_name());
        }
        if (request.getUsername() != null) {
            String normalizedUsername = request.getUsername().trim();
            if (normalizedUsername.isBlank()) {
                throw new IllegalArgumentException("Username cannot be blank");
            }
            if (!normalizedUsername.equals(user.getUsername()) && userRepository.existsByUsername(normalizedUsername)) {
                throw new IllegalArgumentException("Username is already in use");
            }
            user.setUsername(normalizedUsername);
        }
        if (request.getEmail() != null) {
            String normalizedEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
            if (normalizedEmail.isBlank()) {
                throw new IllegalArgumentException("Email cannot be blank");
            }
            if (!normalizedEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(normalizedEmail)) {
                throw new IllegalArgumentException("Email is already in use");
            }
            user.setEmail(normalizedEmail);
        }
        if (request.getPassword_hash() != null && !request.getPassword_hash().isBlank()) {
            user.setPassword_hash(passwordEncoder.encode(request.getPassword_hash()));
        }
        if (request.getMobile_number() != null) {
            user.setMobile_number(request.getMobile_number());
        }
        if (request.getAvatar_url() != null) {
            user.setAvatar_url(request.getAvatar_url());
        }

        user.setUpdated_at(LocalDateTime.now());
        userRepository.update(user);

        String token = jwtService.generateToken(user.getEmail(), user.getRole_name());
        return UpdateProfileResponse.builder()
                .user(user)
                .token(token)
                .build();
    }

    /**
     * Marks the user as inactive ({@code is_active = FALSE}).
     * Existing tokens remain valid until they expire naturally.
     *
     * @param currentEmail the user's email, sourced from the JWT principal
     */
    public void logout(String currentEmail) {
        User user = getCurrentUser(currentEmail);
        userRepository.updateActiveState(user.getUser_id(), false);
    }
}
