package com.example.RentSphere.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDueInfo {
    private Long paymentId;
    private Long contractId;
    private Integer tenantId;
    private Integer installmentNo;
    private LocalDate dueDate;
    private BigDecimal amountDue;
}
