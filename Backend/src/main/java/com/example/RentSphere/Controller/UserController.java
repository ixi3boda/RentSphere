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
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    private ResponseEntity<?> buildErrorResponse(String message, HttpStatus status) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(message)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .error(status.getReasonPhrase())
                .build();
        return ResponseEntity.status(status).body(errorResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.ok(userService.register(request));
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to register user: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(userService.login(request));
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to login: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        try {
            String email = principal.getName();
            return ResponseEntity.ok(userService.getCurrentUser(email));
        } catch (Exception e) {
            return buildErrorResponse("Failed to retrieve user details: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}


