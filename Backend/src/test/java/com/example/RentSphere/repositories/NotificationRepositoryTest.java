package com.example.RentSphere.repositories;

import com.example.RentSphere.Dto.Notification;
import com.example.RentSphere.Repository.NotificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("NotificationRepository Integration Tests")
class NotificationRepositoryTest {

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    @DisplayName("save and findById — persists and retrieves notification")
    void saveAndFindById_success() {

        Notification notification = Notification.builder()
                .recipientId(1)
                .notificationType("TEST")
                .title("Unique Title")
                .body("Body Content")
                .isRead(false)
                .build();

        notificationRepository.save(notification);

        boolean exists = notificationRepository.existsByRecipientTypeAndTitle(1, "TEST", "Unique Title");
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("existsByRecipientTypeAndTitle — returns true when exists, false otherwise")
    void existsByRecipientTypeAndTitle_check() {

        Notification notification = Notification.builder()
                .recipientId(2)
                .notificationType("ALERT")
                .title("Critical Alert")
                .body("System failing")
                .build();
        notificationRepository.save(notification);

        assertThat(notificationRepository.existsByRecipientTypeAndTitle(2, "ALERT", "Critical Alert")).isTrue();
        assertThat(notificationRepository.existsByRecipientTypeAndTitle(2, "ALERT", "Non Existent")).isFalse();
        assertThat(notificationRepository.existsByRecipientTypeAndTitle(3, "ALERT", "Critical Alert")).isFalse();
    }
}
