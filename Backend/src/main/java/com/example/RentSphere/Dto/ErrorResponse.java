package com.example.RentSphere.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standardized REST API error payload structure returned by {@link com.example.RentSphere.Exception.GlobalExceptionHandler}.
 *
 * <p>Contains HTTP status details, error classification, timestamp, and optional field-level validation errors.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResponse {
    private String message;
    private int status;
    private LocalDateTime timestamp;
    private String error;
    private Map<String, String> errors;
}
