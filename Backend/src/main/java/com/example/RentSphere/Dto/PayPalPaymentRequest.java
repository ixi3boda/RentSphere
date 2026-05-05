package com.example.RentSphere.Dto;

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
    private String cancelUrl;
    private String successUrl;
}