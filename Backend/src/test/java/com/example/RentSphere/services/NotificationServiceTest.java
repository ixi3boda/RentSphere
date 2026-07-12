package com.example.RentSphere.services;

import com.example.RentSphere.Dto.Notification;
import com.example.RentSphere.Repository.NotificationRepository;
import com.example.RentSphere.Service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService Unit Tests")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    @DisplayName("createNotification — saves new notification when no duplicate exists")
    void createNotification_new_saves() {

        int recipientId = 1;
        String type = "INFO";
        String title = "Test Title";
        String body = "Test Body";
        when(notificationRepository.existsByRecipientTypeAndTitle(recipientId, type, title)).thenReturn(false);

        notificationService.createNotification(recipientId, type, title, body);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification saved = captor.getValue();
        assertThat(saved.getRecipientId()).isEqualTo(recipientId);
        assertThat(saved.getNotificationType()).isEqualTo(type);
        assertThat(saved.getTitle()).isEqualTo(title);
        assertThat(saved.getBody()).isEqualTo(body);
        assertThat(saved.getIsRead()).isFalse();
    }

    @Test
    @DisplayName("createNotification — skips saving when duplicate exists")
    void createNotification_duplicate_skips() {

        int recipientId = 1;
        String type = "INFO";
        String title = "Test Title";
        String body = "Test Body";
        when(notificationRepository.existsByRecipientTypeAndTitle(recipientId, type, title)).thenReturn(true);

        notificationService.createNotification(recipientId, type, title, body);

        verify(notificationRepository, never()).save(any());
    }
}
