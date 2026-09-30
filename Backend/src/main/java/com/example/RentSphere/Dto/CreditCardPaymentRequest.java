package com.example.RentSphere.Dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreditCardPaymentRequest {

    @NotBlank
    @Pattern(regexp = "\\d{13,19}", message = "card number must be 13 to 19 digits")
    private String cardNumber;

    @NotBlank
    @Size(max = 255)
    private String cardHolderName;

    @NotBlank
    @Pattern(regexp = "(0[1-9]|1[0-2])", message = "expiry month must be 01 to 12")
    private String expiryMonth;

    @NotBlank
    @Pattern(regexp = "\\d{2,4}", message = "expiry year must be a 2 or 4 digit year")
    private String expiryYear;

    @NotBlank
    @Pattern(regexp = "\\d{3,4}", message = "CVV must be 3 or 4 digits")
    private String cvv;

    @Min(1)
    private Integer installmentNo;
}
