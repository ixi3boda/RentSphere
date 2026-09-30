package com.example.RentSphere.Exception;

import com.example.RentSphere.Dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private ResponseEntity<ErrorResponse> buildResponse(String message, HttpStatus status, Map<String, String> errors) {
        ErrorResponse response = ErrorResponse.builder()
                .message(message)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .error(status.getReasonPhrase())
                .errors(errors)
                .build();
        return ResponseEntity.status(status).body(response);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.NOT_FOUND, null);
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedAccessException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.UNAUTHORIZED, null);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, null);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.CONFLICT, null);
    }

    @ExceptionHandler(PaymentProcessingException.class)
    public ResponseEntity<ErrorResponse> handlePaymentException(PaymentProcessingException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, null);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, null);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.UNAUTHORIZED, null);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        return buildResponse("Access denied: " + ex.getMessage(), HttpStatus.FORBIDDEN, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return buildResponse("Validation failed for input fields", HttpStatus.BAD_REQUEST, errors);
    }

    // Raised before the controller body runs, so no controller catch clause can see it: without
    // this a non-numeric path variable such as /api/properties/abc reports a server fault.
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
        return buildResponse("Invalid value for '" + ex.getName() + "'", HttpStatus.BAD_REQUEST, null);
    }

    // A constraint the service did not catch is still a rejected request, not a server fault, and
    // the MySQL text describes schema internals.
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(org.springframework.dao.DataIntegrityViolationException ex) {
        log.warn("Rejected request violated a database constraint", ex);
        return buildResponse("The request conflicts with a data constraint", HttpStatus.BAD_REQUEST, null);
    }

    // An unmapped path surfaces as one of these two, depending on whether the request reached the
    // static-resource handler (runtime) or only the handler mapping (slice tests). Left alone both
    // land in the catch-all below and report a server fault for what is really a bad URL.
    @ExceptionHandler({
            org.springframework.web.servlet.resource.NoResourceFoundException.class,
            org.springframework.web.servlet.NoHandlerFoundException.class })
    public ResponseEntity<ErrorResponse> handleNoResource(Exception ex) {
        return buildResponse("No endpoint for this request", HttpStatus.NOT_FOUND, null);
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(
            org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        return buildResponse("Unsupported method for this endpoint", HttpStatus.METHOD_NOT_ALLOWED, null);
    }

    // A body that will not parse is the caller's mistake, and Jackson's message names internals.
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableBody(
            org.springframework.http.converter.HttpMessageNotReadableException ex) {
        return buildResponse("Request body could not be read", HttpStatus.BAD_REQUEST, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unhandled exception", ex);
        return buildResponse("An unexpected server error occurred", HttpStatus.INTERNAL_SERVER_ERROR, null);
    }
}
