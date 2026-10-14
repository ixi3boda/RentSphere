package com.example.RentSphere.Controller;

import com.example.RentSphere.Dto.AuthResponse;
import com.example.RentSphere.Dto.ErrorResponse;
import com.example.RentSphere.Dto.LoginRequest;
import com.example.RentSphere.Dto.RegisterRequest;
import com.example.RentSphere.Dto.User;
import com.example.RentSphere.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import com.example.RentSphere.Dto.UpdateProfileRequest;
import com.example.RentSphere.Dto.UpdateProfileResponse;
import java.security.Principal;
import java.time.LocalDateTime;

/**
 * REST controller for user identity operations: registration, authentication,
 * profile management, and session logout.
 *
 * <p>All endpoints are mapped under {@code /api/user}. Registration and login
 * are public; all other endpoints require an authenticated caller (JWT bearer token).
 *
 * <p>Each method delegates entirely to {@link com.example.RentSphere.Service.UserService}
 * for business logic; the controller is responsible only for HTTP mapping and
 * error-to-status translation.
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    private String getPrincipalEmail(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalStateException("Unauthorized access");
        }
        return principal.getName();
    }

    private ResponseEntity<?> buildErrorResponse(String message, HttpStatus status) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(message)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .error(status.getReasonPhrase())
                .build();
        return ResponseEntity.status(status).body(errorResponse);
    }

    /**
     * Registers a new account. The role is always set to {@code VISITOR} at registration;
     * promotion to {@code TENANT} or {@code ADMIN} is an operator action.
     * Returns a JWT on success so the caller is immediately authenticated.
     *
     * @param request validated registration payload
     * @return {@code 200 OK} with an {@link com.example.RentSphere.Dto.AuthResponse} containing the JWT
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterRequest request) {
        try {
            return ResponseEntity.ok(userService.register(request));
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to register user", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Authenticates a user and returns a fresh JWT.
     * The user's {@code is_active} flag is set to {@code TRUE} on successful login.
     *
     * @param request email and password payload
     * @return {@code 200 OK} with an {@link com.example.RentSphere.Dto.AuthResponse} containing the JWT
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request) {
        try {
            return ResponseEntity.ok(userService.login(request));
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to login", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns the profile of the currently authenticated user.
     *
     * @param principal injected by Spring Security from the JWT subject
     * @return {@code 200 OK} with the {@link com.example.RentSphere.Dto.User} profile
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        try {
            String email = getPrincipalEmail(principal);
            return ResponseEntity.ok(userService.getCurrentUser(email));
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            return buildErrorResponse("Failed to retrieve user details", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the authenticated user's profile fields. Only non-null fields in the
     * request body are applied. If the email changes, a new JWT is issued so the
     * caller can continue making authenticated requests without re-logging in.
     *
     * @param principal injected by Spring Security from the JWT subject
     * @param request   partial update payload
     * @return {@code 200 OK} with an {@link com.example.RentSphere.Dto.UpdateProfileResponse}
     *         containing the updated user and a fresh JWT
     */
    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(Principal principal, @RequestBody @Valid UpdateProfileRequest request) {
        try {
            String email = getPrincipalEmail(principal);
            UpdateProfileResponse response = userService.updateCurrentUser(email, request);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (AccessDeniedException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to update profile", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Marks the authenticated user as inactive ({@code is_active = FALSE}).
     * Tokens are stateless and remain technically valid until expiry, but the
     * {@code is_active} flag provides an application-level deactivation signal.
     *
     * @param principal injected by Spring Security from the JWT subject
     * @return {@code 200 OK} with an empty body
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(Principal principal) {
        try {
            String email = getPrincipalEmail(principal);
            userService.logout(email);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            return buildErrorResponse("Failed to logout user", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}


