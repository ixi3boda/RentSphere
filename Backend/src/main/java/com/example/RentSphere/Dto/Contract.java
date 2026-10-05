package com.example.RentSphere.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {

    private Long contractId;
    private Long rentalRequestId;
    private Long propertyId;
    private Long ownerId;
    private Long tenantId;
    private String contractStatus;
    private BigDecimal rentAmount;
    private Integer durationMonths;
    private LocalDate startDate;
    private LocalDate endDate;
    private String pdfUrl;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
