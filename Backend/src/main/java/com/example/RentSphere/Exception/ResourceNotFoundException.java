package com.example.RentSphere.Exception;

/**
 * Thrown when a requested entity cannot be found by its identifier.
 * Handled by {@link GlobalExceptionHandler#handleResourceNotFound} yielding HTTP 404 Not Found.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
