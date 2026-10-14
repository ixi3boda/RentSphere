package com.example.RentSphere.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreditCardPaymentResponse {
    private String transactionRef;
    private String status;
    private String message;
    private Integer installmentNo;
    private BigDecimal amountPaid;
    private LocalDateTime paidDate;
}
