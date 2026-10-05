package com.example.RentSphere.SecurityConfig;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for OpenAPI 3 / Swagger documentation generation via Springdoc.
 *
 * <p>Registers the API metadata and sets up the global HTTP Bearer JWT security scheme
 * so requests can be authorized directly inside the Swagger UI interface.
 */
@Configuration
public class OpenApiConfig {

    /**
     * Creates and configures the {@link OpenAPI} metadata and security components.
     *
     * @return the configured {@link OpenAPI} model bean
     */
    @Bean
    public OpenAPI rentSphereOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("RentSphere Platform REST API")
                        .description("Enterprise Property Rental Platform RESTful API with JWT Authentication, Spring Security RBAC, Property Management, and Rental Agreements.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Abdelrahman Essam")
                                .email("abdelrahmanessm508@gmail.com")
                                .url("https://github.com/ixi3boda/RentSphere"))
                        .license(new License().name("MIT License").url("https://opensource.org/licenses/MIT")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
