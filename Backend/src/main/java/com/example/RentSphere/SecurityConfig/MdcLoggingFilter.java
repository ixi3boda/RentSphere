package com.example.RentSphere.SecurityConfig;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Servlet filter that stamps every inbound HTTP request with a unique correlation ID.
 *
 * <p>The ID is written into the SLF4J {@link MDC} under the key {@code correlationId}
 * and echoed back to the caller as the {@code X-Correlation-ID} response header. This
 * means that every log line emitted during the request's lifecycle automatically carries
 * the same ID, allowing a complete request trace to be reconstructed from the log stream
 * by filtering on a single value - without any distributed-tracing infrastructure.
 *
 * <p>Using {@link Ordered#HIGHEST_PRECEDENCE} ensures the ID is in the MDC before any
 * Spring Security filter, so auth failures are also correlated.
 *
 * <p>The MDC is always cleared in the {@code finally} block to prevent ID leakage into
 * threads reused from the container pool.
 *
 * <h2>Logback configuration</h2>
 * Include {@code %X{correlationId}} in your Logback pattern to see the ID in every line:
 * <pre>
 *   &lt;pattern&gt;%d{ISO8601} [%X{correlationId}] %-5level %logger{36} - %msg%n&lt;/pattern&gt;
 * </pre>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MdcLoggingFilter extends OncePerRequestFilter {

    /** MDC key under which the correlation ID is stored for log pattern interpolation. */
    public static final String CORRELATION_ID_KEY = "correlationId";

    /** HTTP response header that echoes the correlation ID back to the caller. */
    public static final String CORRELATION_ID_HEADER = "X-Correlation-ID";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Honour an ID forwarded by an upstream gateway (e.g., Nginx, API gateway);
        // generate a new one if none was provided.
        // The value is client-controlled and ends up in every log line, so anything that is not
        // a short plain token is replaced rather than trusted.
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || !correlationId.matches("[A-Za-z0-9._-]{1,64}")) {
            correlationId = UUID.randomUUID().toString();
        }

        MDC.put(CORRELATION_ID_KEY, correlationId);
        // Echo the final ID in the response so clients can correlate their own logs.
        response.setHeader(CORRELATION_ID_HEADER, correlationId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Always clean up - container thread pools reuse threads across requests.
            MDC.remove(CORRELATION_ID_KEY);
        }
    }
}
