package com.example.RentSphere;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RentSphereApplication {

	public static void main(String[] args) {
		SpringApplication.run(RentSphereApplication.class, args);
	}

}
