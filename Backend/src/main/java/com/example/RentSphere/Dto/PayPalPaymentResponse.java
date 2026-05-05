package com.example.RentSphere.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PayPalPaymentResponse {
    private String paymentId;
    private String status;
    private String approvalUrl;
}