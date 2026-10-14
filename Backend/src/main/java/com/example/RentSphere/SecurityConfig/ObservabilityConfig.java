package com.example.RentSphere.SecurityConfig;

import io.micrometer.observation.ObservationPredicate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.observation.ServerRequestObservationContext;

/**
 * Keeps traces about user requests. Kubernetes probes hit Actuator every few seconds, and
 * Spring Security records a span per filter-chain pass; both would bury the requests that
 * matter. Request metrics are unaffected: they come from the same observation only when it
 * is kept, and the dashboards already exclude {@code /actuator}.
 */
@Configuration
public class ObservabilityConfig {

    @Bean
    public ObservationPredicate ignoreProbesAndSecuritySpans() {
        return (name, context) -> {
            if (name.startsWith("spring.security.")) {
                return false;
            }
            if (context instanceof ServerRequestObservationContext request) {
                return !request.getCarrier().getRequestURI().startsWith("/actuator");
            }
            return true;
        };
    }
}
