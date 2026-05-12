package com.example.RentSphere.Repository;

import com.example.RentSphere.Dto.User;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<User> findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ?";
        try {
            User user = jdbcTemplate.queryForObject(
                    sql,
                    new Object[]{email},
                    (rs, rowNum) -> {
                        User u = new User();

                        u.setUser_id(rs.getInt("user_id"));
                        u.setFull_name(rs.getString("full_name"));
                        u.setEmail(rs.getString("email"));
                        u.setUsername(rs.getString("username"));
                        u.setPassword_hash(rs.getString("password_hash"));
                        u.setMobile_number(rs.getString("mobile_number"));
                        u.setAvatar_url(rs.getString("avatar_url"));
                        u.set_active(rs.getBoolean("is_active"));
                        u.setCreated_at(rs.getTimestamp("created_at").toLocalDateTime());
                        u.setUpdated_at(rs.getTimestamp("updated_at").toLocalDateTime());
                        u.setRole_name(rs.getString("role_name"));

                        return u;
                    }
            );
            return Optional.of(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public boolean existsByEmail(String email) {
        String sql = "SELECT COUNT(1) FROM users WHERE email = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, email);
        return count != null && count > 0;
    }

    public boolean existsByUsername(String username) {
        String sql = "SELECT COUNT(1) FROM users WHERE username = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, username);
        return count != null && count > 0;
    }


    public void save(User user) {

        String insertUserSql = "INSERT INTO users (full_name, email, username, role_name, password_hash, mobile_number, avatar_url, is_active) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        jdbcTemplate.update(insertUserSql,
                user.getFull_name(),
                user.getEmail(),
                user.getUsername(),
                user.getRole_name(),
                user.getPassword_hash(),
                user.getMobile_number(),
                user.getAvatar_url(),
                user.is_active()
        );
    }

    public void update(User user) {
        String sql = "UPDATE users SET full_name = ?, username = ?, email = ?, password_hash = ?, mobile_number = ?, avatar_url = ?, updated_at = NOW() WHERE user_id = ?";
        jdbcTemplate.update(sql,
                user.getFull_name(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword_hash(),
                user.getMobile_number(),
                user.getAvatar_url(),
                user.getUser_id()
        );
    }

    public int updateActiveState(int userId, boolean isActive) {
        String sql = "UPDATE users SET is_active = ?, updated_at = NOW() WHERE user_id = ?";
        return jdbcTemplate.update(sql, isActive, userId);
    }

    public int updateRole(int userId, String roleName) {
        String sql = "UPDATE users SET role_name = ?, updated_at = NOW() WHERE user_id = ?";
        return jdbcTemplate.update(sql, roleName, userId);
    }
}
