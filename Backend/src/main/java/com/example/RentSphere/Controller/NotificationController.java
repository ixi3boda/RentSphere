package com.example.RentSphere.Controller;

import com.example.RentSphere.Dto.ErrorResponse;
import com.example.RentSphere.Dto.Notification;
import com.example.RentSphere.Service.NotificationService;
import com.example.RentSphere.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * REST controller for the in-app notification system.
 *
 * <p>Exposes two endpoints under {@code /api/notifications}:
 * <ul>
 *   <li>{@code GET /my} — returns all notifications for the authenticated user,
 *       ordered newest-first.</li>
 *   <li>{@code PUT /{id}/read} — marks a single notification as read; the
 *       recipient ownership check is enforced in the repository layer.</li>
 * </ul>
 *
 * <p>Notifications are created exclusively by service-layer methods (never by controllers
 * or the client), so there are no creation endpoints here.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    private String getPrincipalEmail(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new IllegalStateException("Unauthorized access");
        }
        return principal.getName();
    }

    private ResponseEntity<?> buildErrorResponse(String message, HttpStatus status) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message(message)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .error(status.getReasonPhrase())
                .build();
        return ResponseEntity.status(status).body(errorResponse);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyNotifications(Principal principal) {
        try {
            String email = getPrincipalEmail(principal);
            int userId = userService.getCurrentUser(email).getUser_id();
            List<Notification> notifications = notificationService.getNotificationsForUser(userId);
            return ResponseEntity.ok(notifications);
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            return buildErrorResponse("Failed to fetch notifications", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Principal principal) {
        try {
            String email = getPrincipalEmail(principal);
            int userId = userService.getCurrentUser(email).getUser_id();
            notificationService.markNotificationAsRead(id, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return buildErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            return buildErrorResponse("Failed to update notification", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
