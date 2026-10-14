package com.example.RentSphere.SecurityConfig;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-client request throttling for {@code /api/**}.
 *
 * <p>The Compose stack rate-limits in Nginx, but the Render deployment exposes this service
 * directly, so the limits have to live in the application as well. Three fixed one-minute
 * windows are kept per client IP:
 * <ul>
 *   <li><strong>auth</strong> - login and registration, to slow password guessing and
 *       account spam;</li>
 *   <li><strong>write</strong> - every other state-changing request;</li>
 *   <li><strong>all</strong> - everything, reads included.</li>
 * </ul>
 * A client over a limit gets {@code 429 Too Many Requests} with a {@code Retry-After} header.
 *
 * <p>Counters are in memory, which is correct for a single instance. Set
 * {@code rentsphere.ratelimit.enabled=false} when load testing from one machine.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000L;
    private static final int MAX_TRACKED_KEYS = 50_000;

    private final boolean enabled;
    private final int authLimit;
    private final int writeLimit;
    private final int allLimit;
    private final List<String> clientIpHeaders;

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(
            @Value("${rentsphere.ratelimit.enabled:true}") boolean enabled,
            @Value("${rentsphere.ratelimit.auth-per-minute:15}") int authLimit,
            @Value("${rentsphere.ratelimit.write-per-minute:90}") int writeLimit,
            @Value("${rentsphere.ratelimit.all-per-minute:600}") int allLimit,
            @Value("${rentsphere.ratelimit.client-ip-headers:}") String clientIpHeaders) {
        this.enabled = enabled;
        this.authLimit = authLimit;
        this.writeLimit = writeLimit;
        this.allLimit = allLimit;
        this.clientIpHeaders = Arrays.stream(clientIpHeaders.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !enabled || !request.getRequestURI().startsWith("/api/")
                || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String client = clientKey(request);
        String path = request.getRequestURI();
        boolean isAuth = path.equals("/api/user/login") || path.equals("/api/user/register");
        boolean isWrite = !"GET".equalsIgnoreCase(request.getMethod()) && !"HEAD".equalsIgnoreCase(request.getMethod());

        long now = System.currentTimeMillis();
        long retryAfter = tryAcquire("all|" + client, allLimit, now);
        if (retryAfter == 0 && isAuth) {
            retryAfter = tryAcquire("auth|" + client, authLimit, now);
        } else if (retryAfter == 0 && isWrite) {
            retryAfter = tryAcquire("write|" + client, writeLimit, now);
        }

        if (retryAfter > 0) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"message\":\"Too many requests, please slow down\",\"status\":429,\"error\":\"Too Many Requests\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    /** Returns 0 when the request fits in the window, otherwise the seconds until it reopens. */
    private long tryAcquire(String key, int limit, long now) {
        if (windows.size() > MAX_TRACKED_KEYS) {
            windows.values().removeIf(w -> now - w.start >= WINDOW_MILLIS);
        }
        Window window = windows.compute(key, (k, w) ->
                w == null || now - w.start >= WINDOW_MILLIS ? new Window(now) : w);
        synchronized (window) {
            if (window.count >= limit) {
                return Math.max(1, (window.start + WINDOW_MILLIS - now + 999) / 1000);
            }
            window.count++;
            return 0;
        }
    }

    // The socket address is the proxy's when the app sits behind one, so a trusted edge header
    // (configured per deployment) wins. Without configuration nothing from the client is trusted.
    private String clientKey(HttpServletRequest request) {
        for (String header : clientIpHeaders) {
            String value = request.getHeader(header);
            if (value != null && !value.isBlank()) {
                String first = value.split(",")[0].trim();
                if (!first.isEmpty() && first.length() <= 45) {
                    return first;
                }
            }
        }
        return request.getRemoteAddr();
    }

    private static final class Window {
        private final long start;
        private int count;

        private Window(long start) {
            this.start = start;
        }
    }
}
