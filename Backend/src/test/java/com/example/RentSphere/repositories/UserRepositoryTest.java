package com.example.RentSphere.repositories;

import com.example.RentSphere.Dto.User;
import com.example.RentSphere.Repository.UserRepository;
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
@DisplayName("UserRepository Integration Tests")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("findByEmail returns user when exists")
    void findByEmail_returnsUser() {
        Optional<User> userOpt = userRepository.findByEmail("admin@test.com");
        assertThat(userOpt).isPresent();
        assertThat(userOpt.get().getUsername()).isEqualTo("adminuser");
    }

    @Test
    @DisplayName("findByEmail returns empty when not exists")
    void findByEmail_returnsEmpty() {
        Optional<User> userOpt = userRepository.findByEmail("nobody@test.com");
        assertThat(userOpt).isEmpty();
    }

    @Test
    @DisplayName("existsByEmail returns true when exists")
    void existsByEmail_returnsTrue() {
        assertThat(userRepository.existsByEmail("tenant@test.com")).isTrue();
    }

    @Test
    @DisplayName("existsByEmail returns false when not exists")
    void existsByEmail_returnsFalse() {
        assertThat(userRepository.existsByEmail("nobody@test.com")).isFalse();
    }

    @Test
    @DisplayName("existsByUsername returns true when exists")
    void existsByUsername_returnsTrue() {
        assertThat(userRepository.existsByUsername("visitoruser")).isTrue();
    }

    @Test
    @DisplayName("existsByUsername returns false when not exists")
    void existsByUsername_returnsFalse() {
        assertThat(userRepository.existsByUsername("unknown")).isFalse();
    }

    @Test
    @DisplayName("save persists new user")
    void save_persistsNewUser() {
        User user = User.builder()
                .full_name("New Test User")
                .email("newuser@test.com")
                .username("newusertest")
                .role_name("VISITOR")
                .password_hash("hash")
                .mobile_number("123456789")
                .is_active(true)
                .build();

        userRepository.save(user);

        Optional<User> savedOpt = userRepository.findByEmail("newuser@test.com");
        assertThat(savedOpt).isPresent();
        assertThat(savedOpt.get().getUsername()).isEqualTo("newusertest");
    }

    @Test
    @DisplayName("updateActiveState modifies is_active")
    void updateActiveState_modifiesActiveFlag() {
        
        Optional<User> userOpt = userRepository.findByEmail("tenant@test.com");
        assertThat(userOpt).isPresent();
        int userId = userOpt.get().getUser_id();
        
        
        int rows = userRepository.updateActiveState(userId, false);
        assertThat(rows).isEqualTo(1);
        
        
        User updated = userRepository.findByEmail("tenant@test.com").get();
        assertThat(updated.is_active()).isFalse();
    }

    @Test
    @DisplayName("updateRole modifies role_name")
    void updateRole_modifiesRole() {
        Optional<User> userOpt = userRepository.findByEmail("visitor@test.com");
        assertThat(userOpt).isPresent();
        int userId = userOpt.get().getUser_id();
        
        int rows = userRepository.updateRole(userId, "TENANT");
        assertThat(rows).isEqualTo(1);
        
        User updated = userRepository.findByEmail("visitor@test.com").get();
        assertThat(updated.getRole_name()).isEqualTo("TENANT");
    }
}
