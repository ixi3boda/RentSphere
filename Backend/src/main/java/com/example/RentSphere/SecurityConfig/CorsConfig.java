package com.example.RentSphere.SecurityConfig;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;


import java.util.Arrays;

/**
 * Cross-Origin Resource Sharing (CORS) filter configuration.
 *
 * <p>Configures allowed HTTP origins, methods, and headers for browser clients.
 * Reads allowed origins from {@code rentsphere.cors.allowed-origins}, defaulting
 * to {@code http://localhost:3000}.
 */
@Configuration
public class CorsConfig {

    /**
     * Defines the application-wide CORS filter.
     *
     * @param allowedOrigins comma-delimited string of permitted origins
     * @return configured {@link CorsFilter}
     */
    @Bean
    public CorsFilter corsFilter(@Value("${rentsphere.cors.allowed-origins:http://localhost:3000}") String allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        // Credentials are on the wire (Bearer tokens), so origins must be explicit, never "*".
        config.setAllowCredentials(true);
        config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList());
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
