package com.example.RentSphere.SecurityConfig;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Spring Web MVC configuration for static resource resolution.
 *
 * <p>Exposes uploaded property images under the {@code /uploads/**} URL pattern,
 * resolved to the local filesystem's {@code uploads/} directory.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Registers resource handlers to serve locally uploaded property photos.
     *
     * @param registry the Spring {@link ResourceHandlerRegistry}
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Use absolute path so static serving works from any working directory
        String uploadPath = "file:" + Paths.get("uploads").toAbsolutePath() + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(0);
    }
}
