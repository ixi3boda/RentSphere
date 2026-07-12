package com.example.RentSphere.services;

import com.example.RentSphere.Dto.User;
import com.example.RentSphere.Repository.UserRepository;
import com.example.RentSphere.Service.MyUserDetailsService;
import com.example.RentSphere.fixtures.TestFixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("MyUserDetailsService Unit Tests")
class MyUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MyUserDetailsService userDetailsService;

    @Test
    @DisplayName("loadUserByUsername — returns UserDetails when user exists")
    void loadUserByUsername_success() {

        User userDto = TestFixtures.tenantUser();
        userDto.setEmail("test@example.com");
        userDto.setRole_name("TENANT");
        userDto.setPassword_hash("hashed_pass");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(userDto));

        UserDetails userDetails = userDetailsService.loadUserByUsername("test@example.com");

        assertThat(userDetails.getUsername()).isEqualTo("test@example.com");
        assertThat(userDetails.getPassword()).isEqualTo("hashed_pass");
        assertThat(userDetails.getAuthorities()).anyMatch(a -> a.getAuthority().equals("ROLE_TENANT"));
    }

    @Test
    @DisplayName("loadUserByUsername — throws UsernameNotFoundException when user not found")
    void loadUserByUsername_notFound_throws() {

        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("missing@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("User not found");
    }
}
