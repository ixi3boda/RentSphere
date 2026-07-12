package com.example.RentSphere.SecurityConfig;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Use absolute path so static serving works from any working directory
        String uploadPath = "file:" + Paths.get("uploads").toAbsolutePath() + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(0);
    }
}
