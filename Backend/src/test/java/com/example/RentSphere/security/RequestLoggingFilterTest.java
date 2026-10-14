package com.example.RentSphere.security;

import com.example.RentSphere.SecurityConfig.RequestLoggingFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(OutputCaptureExtension.class)
@DisplayName("RequestLoggingFilter")
class RequestLoggingFilterTest {

    private final RequestLoggingFilter filter = new RequestLoggingFilter();

    @Test
    @DisplayName("logs method, path and status for API requests, without the query string")
    void apiRequest_isLogged(CapturedOutput output) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/properties/filter");
        request.setQueryString("city=Cairo");
        MockHttpServletResponse response = new MockHttpServletResponse();
        response.setStatus(200);

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(output).contains("GET /api/properties/filter 200");
        assertThat(output).doesNotContain("city=Cairo");
    }

    @Test
    @DisplayName("ignores non-API paths such as the health probes")
    void actuatorRequest_isNotLogged(CapturedOutput output) throws Exception {
        filter.doFilter(new MockHttpServletRequest("GET", "/actuator/health/liveness"),
                new MockHttpServletResponse(), new MockFilterChain());

        assertThat(output).doesNotContain("/actuator/health/liveness");
    }
}
