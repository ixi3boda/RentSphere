package com.example.RentSphere.Dto;

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

    private String propertyType;
    private String title;
    private String propertyDescription;
    private BigDecimal pricePerMonth;
    private String city;
    private String district;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer numRooms;
    private BigDecimal areaSqm;
    private Boolean isAvailable;
    private String coverPic;
}
