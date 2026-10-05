package com.example.RentSphere.Exception;

/**
 * Thrown when an operation attempts to create or update an entity that conflicts with an existing resource.
 * Handled by {@link GlobalExceptionHandler#handleDuplicateResource} yielding HTTP 409 Conflict.
 */
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
