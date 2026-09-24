package com.example.RentSphere.Exception;

import com.example.RentSphere.Dto.ErrorResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("GlobalExceptionHandler Unit Tests")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("Handle ResourceNotFoundException returns 404")
    void handleResourceNotFound() {
        ResponseEntity<ErrorResponse> response = handler.handleResourceNotFound(new ResourceNotFoundException("Not found"));
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Not found", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Handle UnauthorizedAccessException returns 401")
    void handleUnauthorized() {
        ResponseEntity<ErrorResponse> response = handler.handleUnauthorized(new UnauthorizedAccessException("Unauthorized"));
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Unauthorized", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Handle BadRequestException returns 400")
    void handleBadRequest() {
        ResponseEntity<ErrorResponse> response = handler.handleBadRequest(new BadRequestException("Bad request"));
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Bad request", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Handle DuplicateResourceException returns 409")
    void handleDuplicateResource() {
        ResponseEntity<ErrorResponse> response = handler.handleDuplicateResource(new DuplicateResourceException("Duplicate"));
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Duplicate", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Handle PaymentProcessingException returns 400")
    void handlePaymentException() {
        ResponseEntity<ErrorResponse> response = handler.handlePaymentException(new PaymentProcessingException("Payment error"));
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Payment error", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Handle Generic Exception returns 500")
    void handleGenericException() {
        ResponseEntity<ErrorResponse> response = handler.handleGenericException(new RuntimeException("Crash"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().getMessage().contains("Crash"));
    }
}
