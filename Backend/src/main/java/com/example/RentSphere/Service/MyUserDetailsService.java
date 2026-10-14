package com.example.RentSphere.Service;

import com.example.RentSphere.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Spring Security {@link UserDetailsService} adapter backed by {@link UserRepository}.
 *
 * <p>Loads a user principal by email address (which acts as the login username throughout
 * the platform). Maps database role names ({@code TENANT}, {@code ADMIN}, {@code VISITOR})
 * to Spring Security granted authorities via {@code roles(role_name)}, prefixing them with
 * {@code ROLE_} automatically.
 */
@Service
@RequiredArgsConstructor
public class MyUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Locates the user based on their email address.
     *
     * @param email the email identifying the user whose data is required
     * @return a fully populated {@link UserDetails} object
     * @throws UsernameNotFoundException if no user with the given email exists
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .map(userDto -> org.springframework.security.core.userdetails.User
                        .withUsername(userDto.getEmail())
                        .password(userDto.getPassword_hash())
                        .roles(userDto.getRole_name())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
