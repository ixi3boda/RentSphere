package com.example.RentSphere.Exception;

/**
 * Thrown when an incoming request fails semantic or domain validation.
 * Handled by {@link GlobalExceptionHandler#handleBadRequest} yielding HTTP 400.
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
