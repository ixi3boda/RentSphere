package com.example.RentSphere.Dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalRequest {

    private Long rentalReqId;
    private Long propertyId;
    private Long tenantId;

    private String message;
    private LocalDate desiredStart;
    private Integer desiredMonths;
    private BigDecimal offeredPrice;

    private String reqStatus;

    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}