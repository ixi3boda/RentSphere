package com.example.RentSphere.Controller;

import com.example.RentSphere.Dto.Contract;
import com.example.RentSphere.Dto.CreateRentalRequest;
import com.example.RentSphere.Dto.ErrorResponse;
import com.example.RentSphere.Dto.PayPalPaymentRequest;
import com.example.RentSphere.Dto.PayPalPaymentResponse;
import com.example.RentSphere.Dto.RentalRequest;
import com.example.RentSphere.Service.ContractService;
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
    private final ContractService contractService;

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

    @PostMapping("/request")
    public ResponseEntity<?> rentPropertyRequest(
            @RequestBody CreateRentalRequest request,
            Principal principal
    ) {
        try {
            String email = getPrincipalEmail(principal);
            int tenantId = userService.getCurrentUser(email).getUser_id();
            RentalRequest created = rentService.createRentalRequest(request, tenantId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to create rental request: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/requests/all")
    @PreAuthorize("hasRole('ADMIN')")
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

    @GetMapping("/contracts/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllContracts() {
        try {
            return ResponseEntity.ok(contractService.getAllContracts());
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch contracts: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/requests/{id}/accept")
    public ResponseEntity<?> acceptRequest(@PathVariable Long id, Principal principal) {
        try {
            String email = getPrincipalEmail(principal);
            int currentUserId = userService.getCurrentUser(email).getUser_id();
            return ResponseEntity.ok(rentService.acceptRequest(id, currentUserId));
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return buildErrorResponse("Failed to accept rental request: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/contracts/{contractId}/paypal")
    public ResponseEntity<?> createContractPayPalPayment(
            @PathVariable Long contractId,
            @RequestBody PayPalPaymentRequest paymentRequest,
            Principal principal
    ) {
        try {
            String email = getPrincipalEmail(principal);
            int currentUserId = userService.getCurrentUser(email).getUser_id();
            // TODO: Verify user has permission to create payment for this contract
            PayPalPaymentResponse response = contractService.createPayPalPaymentForContract(contractId, paymentRequest);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to create PayPal payment: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/contracts/{contractId}/paypal/execute")
    public ResponseEntity<?> executeContractPayPalPayment(
            @PathVariable Long contractId,
            @RequestParam String paymentId,
            @RequestParam String payerId,
            Principal principal
    ) {
        try {
            String email = getPrincipalEmail(principal);
            int currentUserId = userService.getCurrentUser(email).getUser_id();
            // TODO: Verify user has permission to execute payment for this contract
            PayPalPaymentResponse response = contractService.executePayPalPaymentForContract(contractId, paymentId, payerId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to execute PayPal payment: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/requests/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id, Principal principal) {
        try {
            String email = getPrincipalEmail(principal);
            int currentUserId = userService.getCurrentUser(email).getUser_id();
            return ResponseEntity.ok(rentService.rejectRequest(id, currentUserId));
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return buildErrorResponse("Failed to reject rental request: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
