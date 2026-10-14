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
public class UpdatePropertyRequest {

    @Pattern(regexp = "APARTMENT|STUDIO|VILLA|DUPLEX|OFFICE|SHOP|WAREHOUSE", flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "must be one of APARTMENT, STUDIO, VILLA, DUPLEX, OFFICE, SHOP, WAREHOUSE")
    private String propertyType;

    @Size(min = 3, max = 200)
    @Pattern(regexp = InputRules.LINE, message = "must be plain single-line text")
    private String title;

    @Size(max = 200)
    @Pattern(regexp = InputRules.TEXT, message = "must be plain text")
    private String propertyDescription;

    @DecimalMin(value = "0.01", message = "price per month must be greater than zero")
    @DecimalMax(value = "1000000.00", message = "price per month is unrealistically high")
    @Digits(integer = 7, fraction = 2)
    private BigDecimal pricePerMonth;

    @Size(min = 1, max = 100)
    @Pattern(regexp = InputRules.LINE, message = "must be plain single-line text")
    private String city;

    @Size(max = 100)
    @Pattern(regexp = InputRules.LINE, message = "must be plain single-line text")
    private String district;

    @Size(min = 1, max = 300)
    @Pattern(regexp = InputRules.LINE, message = "must be plain single-line text")
    private String address;

    @DecimalMin("-90.0") @DecimalMax("90.0")
    private BigDecimal latitude;

    @DecimalMin("-180.0") @DecimalMax("180.0")
    private BigDecimal longitude;

    @Min(0) @Max(100)
    private Integer numRooms;

    @DecimalMin("1.0") @DecimalMax("999999.99") @Digits(integer = 6, fraction = 2)
    private BigDecimal areaSqm;

    private Boolean isAvailable;
}
