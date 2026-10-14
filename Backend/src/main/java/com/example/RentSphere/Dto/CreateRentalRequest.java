package com.example.RentSphere.Dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRentalRequest {

    @NotNull
    private Long propertyId;

    @Size(max = 200)
    @Pattern(regexp = InputRules.TEXT, message = "must be plain text")
    private String message;

    @NotNull
    @FutureOrPresent
    private LocalDate desiredStart;

    @Min(1) @Max(24)
    private Integer desiredMonths;
}
