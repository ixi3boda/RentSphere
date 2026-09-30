package com.example.RentSphere.Dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePropertyRequest {

    @NotBlank
    @Pattern(regexp = "APARTMENT|STUDIO|VILLA|DUPLEX|OFFICE|SHOP|WAREHOUSE", flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "must be one of APARTMENT, STUDIO, VILLA, DUPLEX, OFFICE, SHOP, WAREHOUSE")
    private String propertyType;

    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 5000)
    private String propertyDescription;

    @NotNull
    @DecimalMin(value = "0.01", message = "price per month must be greater than zero")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal pricePerMonth;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String district;

    @Size(max = 255)
    private String address;

    @DecimalMin("-90.0") @DecimalMax("90.0")
    private BigDecimal latitude;

    @DecimalMin("-180.0") @DecimalMax("180.0")
    private BigDecimal longitude;

    @Min(0) @Max(100)
    private Integer numRooms;

    @DecimalMin("0.0") @Digits(integer = 8, fraction = 2)
    private BigDecimal areaSqm;

    private Boolean isAvailable;

    @Size(max = 500)
    private String coverPic;
}
