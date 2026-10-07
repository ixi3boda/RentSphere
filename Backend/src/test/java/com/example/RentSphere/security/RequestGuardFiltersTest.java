package com.example.RentSphere.security;

import com.example.RentSphere.SecurityConfig.BodySizeLimitFilter;
import com.example.RentSphere.SecurityConfig.RateLimitFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Request guard filters")
class RequestGuardFiltersTest {

    private static MockHttpServletResponse send(RateLimitFilter filter, String method, String path, String ip,
                                                String forwardedIp) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRemoteAddr(ip);
        if (forwardedIp != null) {
            request.addHeader("CF-Connecting-IP", forwardedIp);
        }
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    @DisplayName("login attempts beyond the limit get 429 with Retry-After")
    void rateLimit_blocksPasswordGuessing() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(true, 3, 90, 600, "");
        for (int i = 0; i < 3; i++) {
            assertThat(send(filter, "POST", "/api/user/login", "203.0.113.7", null).getStatus()).isEqualTo(200);
        }

        MockHttpServletResponse blocked = send(filter, "POST", "/api/user/login", "203.0.113.7", null);
        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getHeader("Retry-After")).isNotNull();

        // another visitor is unaffected, and so are this visitor's reads
        assertThat(send(filter, "POST", "/api/user/login", "203.0.113.8", null).getStatus()).isEqualTo(200);
        assertThat(send(filter, "GET", "/api/properties/filter", "203.0.113.7", null).getStatus()).isEqualTo(200);
    }

    @Test
    @DisplayName("the client header is ignored unless the deployment configured it")
    void rateLimit_doesNotTrustUnconfiguredHeader() throws Exception {
        RateLimitFilter untrusting = new RateLimitFilter(true, 1, 90, 600, "");
        assertThat(send(untrusting, "POST", "/api/user/login", "203.0.113.7", "1.1.1.1").getStatus()).isEqualTo(200);
        // a rotated header value must not buy a fresh window
        assertThat(send(untrusting, "POST", "/api/user/login", "203.0.113.7", "2.2.2.2").getStatus()).isEqualTo(429);

        RateLimitFilter behindEdge = new RateLimitFilter(true, 1, 90, 600, "CF-Connecting-IP");
        assertThat(send(behindEdge, "POST", "/api/user/login", "10.0.0.1", "1.1.1.1").getStatus()).isEqualTo(200);
        assertThat(send(behindEdge, "POST", "/api/user/login", "10.0.0.1", "2.2.2.2").getStatus()).isEqualTo(200);
        assertThat(send(behindEdge, "POST", "/api/user/login", "10.0.0.1", "1.1.1.1").getStatus()).isEqualTo(429);
    }

    @Test
    @DisplayName("a declared body over the limit is refused with 413")
    void bodyLimit_rejectsDeclaredOversize() throws Exception {
        BodySizeLimitFilter filter = new BodySizeLimitFilter(16);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/user/register");
        request.setContent(new byte[64]);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(413);
    }

    @Test
    @DisplayName("a chunked body is cut off once it passes the limit")
    void bodyLimit_cutsOffUndeclaredOversize() throws Exception {
        BodySizeLimitFilter filter = new BodySizeLimitFilter(16);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/user/register") {
            @Override
            public long getContentLengthLong() {
                return -1; // chunked: no Content-Length
            }
        };
        request.setContent(new byte[64]);

        filter.doFilter(request, new MockHttpServletResponse(), (req, res) ->
                assertThatThrownBy(() -> req.getInputStream().readAllBytes())
                        .isInstanceOf(IOException.class)
                        .hasMessageContaining("exceeds"));
    }
}
