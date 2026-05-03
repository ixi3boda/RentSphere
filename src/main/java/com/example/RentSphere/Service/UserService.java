package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.*;
import com.example.RentSphere.Repository.UserRepository;
import com.example.RentSphere.SecurityConfig.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;


    public AuthResponse register(RegisterRequest request) {
        User user = User.builder()
                .email(request.getEmail())
                .password_hash(passwordEncoder.encode(request.getPassword_hash()))
                .username(request.getUsername())
                .full_name(request.getFull_name())
                .avatar_url(request.getAvatar_url())
                .created_at(LocalDateTime.now())
                .updated_at(LocalDateTime.now())
                .mobile_number(request.getMobile_number())
                .role_name("VISITOR")
                .is_active(true)
                .build();
        userRepository.save(user);
        String token = jwtService.generateToken(user.getEmail(),"VISITOR");
        return AuthResponse.builder().token(token).build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword_hash()
                )
        );
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("User not found with email: " + request.getEmail())
                );
        String token = jwtService.generateToken(request.getEmail(),user.getRole_name());
        return AuthResponse.builder().token(token).build();
    }

    public User getCurrentUser(String email){
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        return userRepository.findByEmail(email).orElseThrow(() ->
                new RuntimeException("User not found with email: " + email)
        );
    }

}
