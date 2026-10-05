package com.example.RentSphere.Controller;

import com.example.RentSphere.Dto.Contract;
import com.example.RentSphere.Dto.CreateRentalRequest;
import com.example.RentSphere.Dto.ErrorResponse;
import com.example.RentSphere.Dto.PayPalPaymentRequest;
import com.example.RentSphere.Dto.PayPalPaymentResponse;
import com.example.RentSphere.Dto.RentalRequest;
import com.example.RentSphere.Dto.User;
import com.example.RentSphere.Exception.BadRequestException;
import com.example.RentSphere.Exception.PaymentProcessingException;
import com.example.RentSphere.Exception.ResourceNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import com.example.RentSphere.Service.ContractService;
import com.example.RentSphere.Service.RentService;
import com.example.RentSphere.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;


import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.example.RentSphere.Dto.CreditCardPaymentRequest;
import com.example.RentSphere.Dto.CreditCardPaymentResponse;

/**
 * REST controller for the full rental lifecycle: requests, contracts, and payments.
 *
 * <p>All endpoints are mapped under {@code /api/rent}. Access rules are enforced in
 * two tiers:
 * <ol>
 *   <li><strong>Role tier</strong> — some endpoints are restricted to {@code ADMIN} via
 *       {@code @PreAuthorize}; public read endpoints like the property browse list live
 *       in {@link PropertyController} and are open.
 *   <li><strong>Ownership tier</strong> — accept/reject requires the caller to be the
 *       property owner; payment requires the caller to be the contract tenant (or an admin).
 *       These checks are enforced in the service layer rather than here.
 * </ol>
 *
 * <p>Payment endpoints support both PayPal (two-step: {@code POST /paypal} → redirect →
 * {@code POST /paypal/execute}) and a mock credit-card path ({@code POST /card-payment})
 * for testing without a live PayPal account.
 *
 * <p>All paged list responses follow the same envelope shape:
 * {@code { items, total, page, size }}.
 */
@RestController
@RequestMapping("/api/rent")
@RequiredArgsConstructor
public class RentController {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserService userService;
    private final RentService rentService;
    private final ContractService contractService;

    private String getPrincipalEmail(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalStateException("Unauthorized access");
        }
        return principal.getName();
    }

    private User requireActor(Principal principal) {
        return userService.getCurrentUser(getPrincipalEmail(principal));
    }

    private boolean isAdmin(User actor) {
        return "ADMIN".equalsIgnoreCase(actor.getRole_name());
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
            @RequestBody @Valid CreateRentalRequest request,
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
            return buildErrorResponse("Failed to create rental request", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/requests/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        try {
            int safePage = Math.max(0, page);
            int safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, size));
            return ResponseEntity.ok(Map.of(
                    "items", rentService.getRentalRequests(status, safeSize, safePage * safeSize),
                    "total", rentService.countRentalRequests(status),
                    "page", safePage,
                    "size", safeSize));
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch rental requests", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // One COUNT GROUP BY instead of shipping every request to the browser just to total them.
    @GetMapping("/requests/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> requestSummary() {
        try {
            Map<String, Integer> byStatus = rentService.requestStatusCounts();
            Map<String, Integer> counts = new java.util.LinkedHashMap<>();
            int total = 0;
            for (String status : List.of("PENDING", "ACCEPTED", "REJECTED", "CANCELLED")) {
                int value = byStatus.getOrDefault(status, 0);
                counts.put(status, value);
                total += value;
            }
            Map<String, Object> body = new java.util.LinkedHashMap<>();
            body.put("total", total);
            body.putAll(counts);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch request summary", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<?> getRequestById(@PathVariable Long id, Principal principal) {
        try {
            User actor = requireActor(principal);
            return ResponseEntity.ok(rentService.getByIdForActor(id, actor.getUser_id(), isAdmin(actor)));
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (AccessDeniedException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch rental request", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Every role reads only its own contracts here; the cross-tenant view is the admin-only
    // /contracts/manage endpoint below, which is paged.
    @GetMapping("/contracts/all")
    public ResponseEntity<?> getAllContracts(Principal principal) {
        try {
            User user = requireActor(principal);

            if ("TENANT".equalsIgnoreCase(user.getRole_name())) {
                return ResponseEntity.ok(contractService.getContractsForTenant((long) user.getUser_id()));
            }
            return ResponseEntity.ok(contractService.getContractsForOwner((long) user.getUser_id()));
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch contracts", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/contracts/manage")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> manageContracts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        try {
            int safePage = Math.max(0, page);
            int safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, size));
            return ResponseEntity.ok(Map.of(
                    "items", contractService.getContracts(status, safeSize, safePage * safeSize),
                    "total", contractService.countContracts(status),
                    "page", safePage,
                    "size", safeSize));
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch contracts", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // One COUNT GROUP BY instead of shipping every contract to the browser just to total them.
    @GetMapping("/contracts/manage/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> contractSummary() {
        try {
            Map<String, Integer> byStatus = contractService.contractStatusCounts();
            Map<String, Object> body = new java.util.LinkedHashMap<>();
            int total = 0;
            for (String status : List.of("PENDING", "ACTIVE", "COMPLETED", "CANCELLED")) {
                int value = byStatus.getOrDefault(status, 0);
                body.put(status, value);
                total += value;
            }
            body.put("total", total);
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch contract summary", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/contracts/{contractId}/payments")
    public ResponseEntity<?> getContractPayments(@PathVariable Long contractId, Principal principal) {
        try {
            User actor = requireActor(principal);
            return ResponseEntity.ok(contractService.getPaymentsByContractId(contractId, (long) actor.getUser_id(), isAdmin(actor)));
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (AccessDeniedException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (ResourceNotFoundException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (BadRequestException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch payments", HttpStatus.INTERNAL_SERVER_ERROR);
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
            return buildErrorResponse("Failed to accept rental request", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/contracts/{contractId}/paypal")
    public ResponseEntity<?> createContractPayPalPayment(
            @PathVariable Long contractId,
            @RequestBody PayPalPaymentRequest paymentRequest,
            Principal principal
    ) {
        try {
            User actor = requireActor(principal);
            PayPalPaymentResponse response = contractService.createPayPalPaymentForContract(
                    contractId, paymentRequest, (long) actor.getUser_id(), isAdmin(actor));
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (AccessDeniedException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (ResourceNotFoundException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (BadRequestException
                 | PaymentProcessingException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to create PayPal payment", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/contracts/{contractId}/paypal/execute")
    public ResponseEntity<?> executeContractPayPalPayment(
            @PathVariable Long contractId,
            @RequestParam String paymentId,
            @RequestParam String payerId,
            @RequestParam(required = false) Integer installmentNo,
            Principal principal
    ) {
        try {
            User actor = requireActor(principal);
            PayPalPaymentResponse response = contractService.executePayPalPaymentForContract(
                    contractId, paymentId, payerId, installmentNo, (long) actor.getUser_id(), isAdmin(actor));
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (AccessDeniedException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (ResourceNotFoundException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (BadRequestException
                 | PaymentProcessingException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Failed to execute PayPal payment", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/contracts/{contractId}/card-payment")
    public ResponseEntity<?> processContractCardPayment(
            @PathVariable Long contractId,
            @RequestBody @Valid CreditCardPaymentRequest paymentRequest,
            Principal principal
    ) {
        try {
            User actor = requireActor(principal);
            CreditCardPaymentResponse response = contractService.processCreditCardPaymentForContract(
                    contractId, paymentRequest, (long) actor.getUser_id(), isAdmin(actor));
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (AccessDeniedException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.FORBIDDEN);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (ResourceNotFoundException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (BadRequestException
                 | PaymentProcessingException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return buildErrorResponse("Credit card payment failed", HttpStatus.BAD_REQUEST);
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
            return buildErrorResponse("Failed to reject rental request", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
