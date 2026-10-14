package com.example.RentSphere.Exception;

/**
 * Thrown when an unauthenticated caller or invalid token attempts access to a protected resource.
 * Handled by {@link GlobalExceptionHandler#handleUnauthorized} yielding HTTP 401 Unauthorized.
 */
public class UnauthorizedAccessException extends RuntimeException {
    public UnauthorizedAccessException(String message) {
        super(message);
    }
}
