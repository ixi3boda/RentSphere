package com.example.RentSphere.Repository;

import com.example.RentSphere.Dto.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class NotificationRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Notification> notificationMapper = (ResultSet rs, int rowNum) -> Notification.builder()
            .notiId(rs.getLong("noti_id"))
            .recipientId(rs.getInt("recipient_id"))
            .notificationType(rs.getString("notification_type"))
            .title(rs.getString("title"))
            .body(rs.getString("body"))
            .isRead(rs.getBoolean("is_read"))
            .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
            .build();

    public void save(Notification notification) {
        String sql = "INSERT INTO notifications (recipient_id, notification_type, title, body) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql,
                notification.getRecipientId(),
                notification.getNotificationType(),
                notification.getTitle(),
                notification.getBody());
    }

    public boolean existsByRecipientTypeAndTitle(int recipientId, String type, String title) {
        String sql = "SELECT COUNT(*) FROM notifications WHERE recipient_id = ? AND notification_type = ? AND title = ?";
        Integer count = jdbcTemplate.queryForObject(sql, new Object[]{recipientId, type, title}, Integer.class);
        return count != null && count > 0;
    }

    public Optional<Notification> findById(Long id) {
        String sql = "SELECT * FROM notifications WHERE noti_id = ?";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, new Object[]{id}, notificationMapper));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}
