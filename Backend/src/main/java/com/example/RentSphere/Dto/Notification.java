package com.example.RentSphere.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    private Long notiId;
    private Integer recipientId;
    private String notificationType;
    private String title;
    private String body;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
