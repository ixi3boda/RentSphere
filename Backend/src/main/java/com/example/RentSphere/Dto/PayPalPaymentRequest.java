package com.example.RentSphere.Dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PayPalPaymentRequest {
    private Double amount;
    private String currency;
    private String description;
    @Size(max = 300)
    private String cancelUrl;
    @Size(max = 300)
    private String successUrl;
    @Min(1)
    private Integer installmentNo;
}