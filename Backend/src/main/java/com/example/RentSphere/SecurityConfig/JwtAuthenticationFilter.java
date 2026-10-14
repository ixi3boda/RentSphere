package com.example.RentSphere.SecurityConfig;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Servlet filter that authenticates inbound requests using JWT bearer tokens.
 *
 * <p>On every request that carries an {@code Authorization: Bearer <token>} header:
 * <ol>
 *   <li>The token is parsed and the subject (email) is extracted via {@link JwtService}.</li>
 *   <li>The email is used to load the {@link UserDetails} from the database.</li>
 *   <li>If the token is valid (signature correct and not expired), a
 *       {@link UsernamePasswordAuthenticationToken} is placed in the
 *       {@link SecurityContextHolder} for the duration of the request.</li>
 * </ol>
 *
 * <p>If the token is absent, malformed, or expired the filter does NOT reject the request
 * outright - it simply leaves the {@code SecurityContext} empty and lets the
 * downstream {@link SecurityFilterChain} decide whether the anonymous request is
 * allowed. This means public endpoints continue to work without any token.
 *
 * <p>The register and login paths are excluded from filtering via
 * {@link #shouldNotFilter} to avoid unnecessary database lookups for unauthenticated
 * requests.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/api/user/register") || path.startsWith("/api/user/login");
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String email;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        try {
            email = jwtService.extractUsername(jwt);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(email);

                if (jwtService.isTokenValid(jwt, userDetails.getUsername())) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // The request continues anonymously; protected endpoints still reject it downstream.
            log.debug("Discarded invalid bearer token for {}", request.getRequestURI(), e);
        }
        filterChain.doFilter(request, response);
    }
}
