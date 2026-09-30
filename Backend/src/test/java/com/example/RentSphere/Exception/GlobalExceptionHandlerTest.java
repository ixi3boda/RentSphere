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
    @DisplayName("Wrong HTTP method returns 405")
    void handleMethodNotSupported() {
        ResponseEntity<ErrorResponse> response = handler.handleMethodNotSupported(
                new org.springframework.web.HttpRequestMethodNotSupportedException("DELETE"));
        assertEquals(HttpStatus.METHOD_NOT_ALLOWED, response.getStatusCode());
    }

    @Test
    @DisplayName("Unparseable body returns 400 without leaking Jackson text")
    void handleUnreadableBody() {
        ResponseEntity<ErrorResponse> response = handler.handleUnreadableBody(
                new org.springframework.http.converter.HttpMessageNotReadableException(
                        "Unexpected character at index 0 in com.fasterxml.jackson.core.JsonParseException",
                        new org.springframework.http.HttpInputMessage() {
                            public org.springframework.http.HttpHeaders getHeaders() {
                                return new org.springframework.http.HttpHeaders();
                            }
                            public java.io.InputStream getBody() {
                                return new java.io.ByteArrayInputStream(new byte[0]);
                            }
                        }));
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertFalse(response.getBody().getMessage().contains("Jackson"));
    }

    @Test
    @DisplayName("Handle Generic Exception returns 500 without leaking internals")
    void handleGenericException() {
        ResponseEntity<ErrorResponse> response = handler.handleGenericException(new RuntimeException("Connection refused to db host"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertFalse(response.getBody().getMessage().contains("Connection refused"));
    }
}
