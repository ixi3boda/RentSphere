package com.example.RentSphere.Controller;

import com.example.RentSphere.Dto.CreateRentalRequest;
import com.example.RentSphere.Dto.ErrorResponse;
import com.example.RentSphere.Dto.RentalRequest;
import com.example.RentSphere.Service.RentService;
import com.example.RentSphere.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;


import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/rent")
@RequiredArgsConstructor
public class RentController {

    private final UserService userService;
    private final RentService rentService;

    private ResponseEntity<?> buildErrorResponse(String message, HttpStatus status) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(message)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .error(status.getReasonPhrase())
                .build();
        return ResponseEntity.status(status).body(errorResponse);
    }

    @PostMapping("/request")
    public ResponseEntity<?> rentPropertyRequest(
            @RequestBody CreateRentalRequest request,
            Principal principal
    ) {
        try {
            String email = principal.getName();
            int tenantId = userService.getCurrentUser(email).getUser_id();
            RentalRequest created = rentService.createRentalRequest(request, tenantId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to create rental request: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/requests/all")
    public ResponseEntity<?> getAllRequests() {
        try {
            return ResponseEntity.ok(rentService.getAllRentalRequests());
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch rental requests: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<?> getRequestById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(rentService.getById(id));
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch rental request: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/requests/{id}/accept")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> acceptRequest(@PathVariable Long id, Principal principal) {
        try {
            String email = principal.getName();
            int currentUserId = userService.getCurrentUser(email).getUser_id();
            return ResponseEntity.ok(rentService.acceptRequest(id, currentUserId));
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return buildErrorResponse("Failed to accept rental request: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/requests/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id, Principal principal) {
        try {
            String email = principal.getName();
            int currentUserId = userService.getCurrentUser(email).getUser_id();
            return ResponseEntity.ok(rentService.rejectRequest(id, currentUserId));
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return buildErrorResponse("Failed to reject rental request: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
