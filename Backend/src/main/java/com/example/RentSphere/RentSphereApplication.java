package com.example.RentSphere;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the RentSphere property rental platform backend service.
 *
 * <p>Bootstraps the Spring Boot application context with:
 * <ul>
 *   <li>Stateless JWT security filter chain ({@link com.example.RentSphere.SecurityConfig.SecConfig})</li>
 *   <li>Scheduled background tasks for lease termination ({@link com.example.RentSphere.Service.ContractSchedulerService})</li>
 *   <li>MDC correlation tracing for structured logging ({@link com.example.RentSphere.SecurityConfig.MdcLoggingFilter})</li>
 *   <li>Springdoc OpenAPI 3 documentation endpoints</li>
 * </ul>
 */
@SpringBootApplication
@EnableScheduling
public class RentSphereApplication {

	/**
	 * Application bootstrap launcher.
	 *
	 * @param args command-line arguments passed at startup
	 */
	public static void main(String[] args) {
		SpringApplication.run(RentSphereApplication.class, args);
	}
}
