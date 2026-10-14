package com.example.RentSphere.Exception;

/**
 * Thrown when an online payment gateway transaction or verification fails.
 * Handled by {@link GlobalExceptionHandler#handlePaymentException} yielding HTTP 400 Bad Request.
 */
public class PaymentProcessingException extends RuntimeException {
    public PaymentProcessingException(String message) {
        super(message);
    }
}
