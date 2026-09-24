package com.example.RentSphere.controllers;

import com.example.RentSphere.Dto.Notification;
import com.example.RentSphere.SecurityConfig.JwtService;
import com.example.RentSphere.Service.NotificationService;
import com.example.RentSphere.Service.UserService;
import com.example.RentSphere.fixtures.TestFixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@org.springframework.context.annotation.Import({com.example.RentSphere.SecurityConfig.SecConfig.class, com.example.RentSphere.SecurityConfig.JwtAuthenticationFilter.class})
@WebMvcTest(com.example.RentSphere.Controller.NotificationController.class)
@DisplayName("NotificationController MockMvc Tests")
class NotificationControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private NotificationService notificationService;
    @MockBean private UserService userService;
    @MockBean private JwtService jwtService;
    @MockBean private org.springframework.security.core.userdetails.UserDetailsService myUserDetailsService;

    @Test
    @DisplayName("GET /my — 200 for authenticated user")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void getMyNotifications_authenticated_returns200() throws Exception {
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(TestFixtures.tenantUser());
        Notification noti = Notification.builder()
                .notiId(1L)
                .recipientId(2)
                .notificationType("NEW_REQUEST")
                .title("New Request")
                .body("You have a request")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        when(notificationService.getNotificationsForUser(2)).thenReturn(List.of(noti));

        mockMvc.perform(get("/api/notifications/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].title").value("New Request"));
    }

    @Test
    @DisplayName("PUT /{id}/read — 200 for authenticated user")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void markAsRead_authenticated_returns200() throws Exception {
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(TestFixtures.tenantUser());
        doNothing().when(notificationService).markNotificationAsRead(1L, 2);

        mockMvc.perform(put("/api/notifications/1/read").with(csrf()))
                .andExpect(status().isOk());
    }
}
