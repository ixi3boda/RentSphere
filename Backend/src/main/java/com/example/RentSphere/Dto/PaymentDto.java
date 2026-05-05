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
public class PaymentDto {

    private Long paymentId;
    private Long contractId;
    private String paymentStatus;
    private Integer installmentNo;
    private LocalDate dueDate;
    private LocalDateTime paidDate;
    private BigDecimal amountDue;
    private BigDecimal amountPaid;
    private String transactionRef;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
