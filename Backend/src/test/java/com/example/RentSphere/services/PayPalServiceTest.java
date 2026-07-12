package com.example.RentSphere.services;

import com.example.RentSphere.Dto.PayPalPaymentRequest;
import com.example.RentSphere.Service.PayPalService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
@DisplayName("PayPalService Unit Tests")
class PayPalServiceTest {

    @InjectMocks
    private PayPalService payPalService;

    @Test
    @DisplayName("createPayment — throws exception when request is null")
    void createPayment_nullRequest_throws() {
        assertThatThrownBy(() -> payPalService.createPayment(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be null");
    }

    @Test
    @DisplayName("createPayment — throws exception when amount is zero or negative")
    void createPayment_invalidAmount_throws() {
        PayPalPaymentRequest req = new PayPalPaymentRequest();
        req.setAmount(0.0);
        assertThatThrownBy(() -> payPalService.createPayment(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Amount must be greater than 0");

        req.setAmount(-10.0);
        assertThatThrownBy(() -> payPalService.createPayment(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Amount must be greater than 0");
    }

    @Test
    @DisplayName("createPayment — throws exception when currency is missing")
    void createPayment_missingCurrency_throws() {
        PayPalPaymentRequest req = new PayPalPaymentRequest();
        req.setAmount(100.0);
        req.setCurrency("");
        assertThatThrownBy(() -> payPalService.createPayment(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Currency is required");
    }

    @Test
    @DisplayName("executePayment — throws exception when IDs are missing")
    void executePayment_missingIds_throws() {
        assertThatThrownBy(() -> payPalService.executePayment("", "payer123"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Payment ID is required");

        assertThatThrownBy(() -> payPalService.executePayment("pay123", " "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Payer ID is required");
    }

    @Test
    @DisplayName("getPaymentDetails — throws exception when paymentId is missing")
    void getPaymentDetails_missingId_throws() {
        assertThatThrownBy(() -> payPalService.getPaymentDetails(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Payment ID is required");
    }
}
