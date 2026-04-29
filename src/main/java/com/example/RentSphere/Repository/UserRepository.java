package com.example.RentSphere.Repository;

import com.example.RentSphere.Dto.User;
import com.example.RentSphere.Dto.*;
import jakarta.transaction.Transactional;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
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

                        return u;
                    }
            );
            return Optional.of(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public UserDetails getCurrentUser(String email) {

        String userSql = "SELECT * FROM users WHERE email = ?";
        String roleSql = "SELECT role_name FROM user_roles WHERE user_id = ?";

        try {
            User user = jdbcTemplate.queryForObject(userSql, new Object[]{email}, (rs, rowNum) -> {
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

                return u;
            });

            List<Role> roles = jdbcTemplate.query(
                    roleSql,
                    new Object[]{user.getUser_id()},
                    (rs, rowNum) -> Role.valueOf(rs.getString("role_name"))
            );

            return UserDetails.builder()
                    .user(user)
                    .roles(roles)
                    .build();
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public void save(User user) {

        String insertUserSql = "INSERT INTO users (full_name, email, username, password_hash, mobile_number, avatar_url, is_active) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";

        jdbcTemplate.update(insertUserSql,
                user.getFull_name(),
                user.getEmail(),
                user.getUsername(),
                user.getPassword_hash(),
                user.getMobile_number(),
                user.getAvatar_url(),
                user.is_active()
        );

        String getUserIdSql = "SELECT user_id FROM users WHERE email = ?";
        Integer userId = jdbcTemplate.queryForObject(getUserIdSql, Integer.class, user.getEmail());

        if (userId == null) {
            throw new RuntimeException("User ID not found");
        }

        String insertUserRoleSql = "INSERT INTO user_roles (user_id, role_name) VALUES (?, ?)";
        jdbcTemplate.update(insertUserRoleSql, userId, "VISITOR");
    }
}
