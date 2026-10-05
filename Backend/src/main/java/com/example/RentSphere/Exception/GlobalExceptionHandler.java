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

/**
 * Centralised HTTP error handling for the RentSphere REST API.
 *
 * <p>Every exception that escapes a controller method is caught here and mapped to a
 * structured {@link ErrorResponse} body with a consistent shape:
 * <pre>
 * {
 *   "message": "Human-readable description",
 *   "status": 404,
 *   "error": "Not Found",
 *   "timestamp": "2026-10-01T09:00:00",
 *   "errors": null            // populated for validation failures only
 * }
 * </pre>
 *
 * <p>The ordering of {@code @ExceptionHandler} methods follows the principle of
 * most-specific first: domain exceptions are matched before the generic
 * {@link Exception} catch-all at the bottom, which logs the full stack trace at
 * ERROR level and returns a 500 without leaking internal details.
 *
 * <p>Sensitive internals (SQL messages, class names, stack traces) are never leaked
 * to callers — the handler logs them at WARN/ERROR and replaces them with a generic
 * description in the response body.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Builds a uniform {@link ErrorResponse} wrapped in a {@link ResponseEntity}.
     *
     * @param message  human-readable error description sent to the caller
     * @param status   HTTP status code for the response
     * @param errors   field-level validation errors, or {@code null} for non-validation failures
     * @return a {@link ResponseEntity} containing the serialised {@link ErrorResponse}
     */
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

    /**
     * Handles {@link ResourceNotFoundException} — entity looked up by ID does not exist.
     * Returns {@code 404 Not Found}.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.NOT_FOUND, null);
    }

    /**
     * Handles {@link UnauthorizedAccessException} — caller is not authenticated or their
     * token does not identify a valid user.
     * Returns {@code 401 Unauthorized}.
     */
    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedAccessException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.UNAUTHORIZED, null);
    }

    /**
     * Handles {@link BadRequestException} — caller supplied a semantically invalid request
     * that passed JSON parsing but failed domain validation.
     * Returns {@code 400 Bad Request}.
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, null);
    }

    /**
     * Handles {@link DuplicateResourceException} — the requested operation would create a
     * duplicate (e.g., registering with an email that already exists).
     * Returns {@code 409 Conflict}.
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.CONFLICT, null);
    }

    /**
     * Handles {@link PaymentProcessingException} — a payment gateway operation failed
     * (e.g., PayPal rejected the transaction or the captured amount does not match the due amount).
     * Returns {@code 400 Bad Request}.
     */
    @ExceptionHandler(PaymentProcessingException.class)
    public ResponseEntity<ErrorResponse> handlePaymentException(PaymentProcessingException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, null);
    }

    /**
     * Handles {@link IllegalArgumentException} — a service-layer guard rejected an argument.
     * Returns {@code 400 Bad Request}.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.BAD_REQUEST, null);
    }

    /**
     * Handles {@link IllegalStateException} — an operation was attempted in an invalid state
     * (e.g., accessing a protected endpoint without a principal).
     * Returns {@code 401 Unauthorized}.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
        return buildResponse(ex.getMessage(), HttpStatus.UNAUTHORIZED, null);
    }

    /**
     * Handles Spring Security's {@link org.springframework.security.access.AccessDeniedException}
     * — the authenticated caller does not have the required role or ownership for the operation.
     * Returns {@code 403 Forbidden}.
     */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        return buildResponse("Access denied: " + ex.getMessage(), HttpStatus.FORBIDDEN, null);
    }

    /**
     * Handles {@link MethodArgumentNotValidException} thrown by Bean Validation on
     * {@code @Valid}-annotated request bodies. Collects all field errors into the
     * {@code errors} map so the caller knows exactly which fields failed and why.
     * Returns {@code 400 Bad Request}.
     */
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

    /**
     * Handles {@link org.springframework.web.method.annotation.MethodArgumentTypeMismatchException}
     * — raised before the controller body runs when a path or query variable cannot be converted
     * to its declared type (e.g., {@code /api/properties/abc} for a {@code Long} path variable).
     * Without this handler the exception would fall through to the 500 catch-all.
     * Returns {@code 400 Bad Request}.
     */
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
        return buildResponse("Invalid value for '" + ex.getName() + "'", HttpStatus.BAD_REQUEST, null);
    }

    /**
     * Handles {@link org.springframework.dao.DataIntegrityViolationException} — a database
     * constraint (unique key, check constraint, FK) that was not pre-validated in the service
     * layer was violated at persist time. The raw MySQL message is logged but not forwarded to
     * the caller because it can expose schema details.
     * Returns {@code 400 Bad Request}.
     */
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(org.springframework.dao.DataIntegrityViolationException ex) {
        log.warn("Rejected request violated a database constraint", ex);
        return buildResponse("The request conflicts with a data constraint", HttpStatus.BAD_REQUEST, null);
    }

    /**
     * Handles unmapped path exceptions. An unmapped URL surfaces as one of two types
     * depending on whether it reached the static-resource handler at runtime or only the
     * handler-mapping layer during slice tests. Left unhandled, both would land in the
     * generic catch-all and report a server fault for what is really a bad URL.
     * Returns {@code 404 Not Found}.
     */
    @ExceptionHandler({
            org.springframework.web.servlet.resource.NoResourceFoundException.class,
            org.springframework.web.servlet.NoHandlerFoundException.class })
    public ResponseEntity<ErrorResponse> handleNoResource(Exception ex) {
        return buildResponse("No endpoint for this request", HttpStatus.NOT_FOUND, null);
    }

    /**
     * Handles {@link org.springframework.web.HttpRequestMethodNotSupportedException}
     * — the URL matched a known path but the HTTP method is not mapped.
     * Returns {@code 405 Method Not Allowed}.
     */
    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(
            org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        return buildResponse("Unsupported method for this endpoint", HttpStatus.METHOD_NOT_ALLOWED, null);
    }

    /**
     * Handles {@link org.springframework.http.converter.HttpMessageNotReadableException}
     * — the request body could not be parsed (malformed JSON, wrong content type, etc.).
     * The underlying Jackson error message is intentionally suppressed because it names
     * internal class details.
     * Returns {@code 400 Bad Request}.
     */
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableBody(
            org.springframework.http.converter.HttpMessageNotReadableException ex) {
        return buildResponse("Request body could not be read", HttpStatus.BAD_REQUEST, null);
    }

    /**
     * Last-resort handler for any exception not matched by a more specific handler above.
     * Logs the full stack trace at ERROR level (so it appears in production alerting) and
     * returns a generic message without any internal detail.
     * Returns {@code 500 Internal Server Error}.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unhandled exception", ex);
        return buildResponse("An unexpected server error occurred", HttpStatus.INTERNAL_SERVER_ERROR, null);
    }
}
