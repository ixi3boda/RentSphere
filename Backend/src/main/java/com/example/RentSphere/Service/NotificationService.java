package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.Notification;
import com.example.RentSphere.Repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Business-logic layer for the in-app notification system.
 *
 * <p>Notifications are written exclusively by service-layer methods (never directly by
 * controllers or the scheduler) and are read or acknowledged by the recipient through
 * the REST API. The underlying storage is a plain {@code notifications} table with a
 * CHECK constraint that limits {@code notification_type} to a fixed enum defined in
 * {@code Database/Schema.sql}. Any call to
 * {@link #createNotification(int, String, String, String)} with an unknown type will
 * cause a {@code DataIntegrityViolationException} at the JDBC layer, which bubbles up
 * through {@code GlobalExceptionHandler} as a 400 — this is intentional, as an unknown
 * type signals a programming error rather than a user mistake.
 *
 * <p>Notification deduplication: the same {@code (recipient, type, title)} triple can
 * be written at most once. This prevents a scheduler tick from flooding a user's inbox
 * if an upstream event fires multiple times (e.g., a payment reminder that runs while
 * the previous one is still unread).
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Creates a notification for the given recipient, provided no identical notification
     * (same recipient, type, and title) already exists.
     *
     * <p>Callers are encouraged to embed the relevant entity ID in the title so that
     * per-entity deduplication works correctly. For example, a NEW_REQUEST notification
     * title of {@code "New request #42 for property #7"} is unique per request, so an
     * owner will receive one notification per incoming request rather than only ever
     * seeing the first one.
     *
     * @param recipientId      database ID of the user who will receive the notification
     * @param notificationType one of the values in the {@code chk_noti_type} CHECK constraint
     *                         ({@code NEW_REQUEST}, {@code REQUEST_ACCEPTED}, etc.)
     * @param title            short, user-visible subject line (max 200 chars)
     * @param body             longer user-visible detail text (max 200 chars)
     */
    public void createNotification(int recipientId, String notificationType, String title, String body) {
        if (!notificationRepository.existsByRecipientTypeAndTitle(recipientId, notificationType, title)) {
            Notification notification = Notification.builder()
                    .recipientId(recipientId)
                    .notificationType(notificationType)
                    .title(title)
                    .body(body)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }
    }

    /**
     * Returns all notifications for the given recipient, ordered by creation date (newest first).
     *
     * @param recipientId database ID of the recipient
     * @return list of {@link Notification} objects; empty if the user has no notifications
     */
    public java.util.List<Notification> getNotificationsForUser(int recipientId) {
        return notificationRepository.findByRecipientId(recipientId);
    }

    /**
     * Marks a single notification as read, provided it belongs to the specified recipient.
     * The ownership check is enforced in the repository layer with a
     * {@code WHERE noti_id = ? AND recipient_id = ?} predicate.
     *
     * @param notiId      primary key of the notification
     * @param recipientId database ID of the expected recipient (prevents cross-user read)
     */
    public void markNotificationAsRead(Long notiId, int recipientId) {
        notificationRepository.markAsRead(notiId, recipientId);
    }

    /**
     * Returns the number of unread notifications for the given recipient.
     * Used by the UI to render the notification bell badge count.
     *
     * @param recipientId database ID of the recipient
     * @return count of notifications where {@code is_read = FALSE}
     */
    public int getUnreadCount(int recipientId) {
        return notificationRepository.countUnreadByRecipientId(recipientId);
    }
}
