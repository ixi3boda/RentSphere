package com.example.RentSphere.SecurityConfig;

import org.springframework.security.core.userdetails.UserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security filter-chain configuration for RentSphere.
 *
 * <p>Configures stateless JWT authentication, RBAC authorization, CORS, and CSRF
 * (disabled - the API is stateless and relies on JWT bearer tokens instead of cookies).
 *
 * <p>Public paths (register, login, public property endpoints, Swagger UI, and Actuator)
 * are listed explicitly in {@link #securityFilterChain}. Every other path requires
 * an authenticated caller. Fine-grained ownership checks beyond simple role matching
 * are enforced in the service layer rather than here, keeping this class focused on
 * authentication and coarse-grained role filters only.
 *
 * <p>{@code @EnableMethodSecurity} activates {@code @PreAuthorize} annotations on
 * controller methods that require the {@code ADMIN} role.
 */
@EnableMethodSecurity
@Configuration
@RequiredArgsConstructor
public class SecConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService myUserDetailsService;

    /**
     * Defines the security filter chain applied to every HTTP request.
     *
     * <ul>
     *   <li>CSRF is disabled - the API is consumed by an SPA with bearer-token auth.</li>
     *   <li>CORS is delegated to {@link CorsConfig}.</li>
     *   <li>{@link JwtAuthenticationFilter} runs before Spring's username/password filter
     *       so bearer tokens are resolved on the first pass.</li>
     * </ul>
     *
     * @param http the Spring Security {@link HttpSecurity} builder
     * @return the configured {@link SecurityFilterChain}
     * @throws Exception if the configuration cannot be applied
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/user/register").permitAll()
                        .requestMatchers("/api/user/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/properties/filter").permitAll()
                        // Must precede the "/api/properties/*" wildcard, which would otherwise make it public.
                        .requestMatchers(HttpMethod.GET, "/api/properties/my").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/properties/*").permitAll()
                        .requestMatchers("/actuator/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(myUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
