package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.Notification;
import com.example.RentSphere.Repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

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
}
