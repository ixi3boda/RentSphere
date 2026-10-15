package com.example.RentSphere.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.micrometer.metrics.test.autoconfigure.AutoConfigureMetrics;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalManagementPort;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

/** The Kubernetes setup: Actuator on its own port, with the Prometheus endpoint exposed. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "management.endpoints.web.exposure.include=health,prometheus")
@ActiveProfiles("test")
// Tests switch metrics export off by default; this keeps the Prometheus registry
@AutoConfigureMetrics
@DisplayName("Management port")
class ManagementPortTest {

    private static final HttpClient HTTP = HttpClient.newHttpClient();

    @LocalServerPort private int serverPort;
    @LocalManagementPort private int managementPort;

    @DynamicPropertySource
    static void managementPort(DynamicPropertyRegistry registry) throws IOException {
        try (ServerSocket socket = new ServerSocket(0)) {
            int port = socket.getLocalPort();
            registry.add("management.server.port", () -> port);
        }
    }

    private HttpResponse<String> get(int port, String path) throws Exception {
        return HTTP.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).build(),
                HttpResponse.BodyHandlers.ofString());
    }

    @Test
    @DisplayName("Prometheus can scrape the management port without a token")
    void prometheus_onManagementPort_isOpen() throws Exception {
        HttpResponse<String> response = get(managementPort, "/actuator/prometheus");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("jvm_memory_used_bytes");
    }

    @Test
    @DisplayName("the public API port does not serve the metrics")
    void prometheus_onApiPort_isNotServed() throws Exception {
        assertThat(get(serverPort, "/actuator/prometheus").statusCode()).isNotEqualTo(200);
    }

    @Test
    @DisplayName("Kubernetes probes answer on the management port")
    void probes_onManagementPort() throws Exception {
        assertThat(get(managementPort, "/actuator/health/liveness").statusCode()).isEqualTo(200);
        assertThat(get(managementPort, "/actuator/health/readiness").statusCode()).isEqualTo(200);
    }
}
