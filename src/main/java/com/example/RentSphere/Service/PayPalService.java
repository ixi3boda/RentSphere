package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.PayPalPaymentRequest;
import com.example.RentSphere.Dto.PayPalPaymentResponse;
import com.paypal.api.payments.*;
import com.paypal.base.rest.APIContext;
import com.paypal.base.rest.PayPalRESTException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PayPalService {

    @Value("${paypal.client.id}")
    private String clientId;

    @Value("${paypal.client.secret}")
    private String clientSecret;

    @Value("${paypal.mode}")
    private String mode;

    public PayPalPaymentResponse createPayment(PayPalPaymentRequest paymentRequest) throws PayPalRESTException {
        if (paymentRequest == null) {
            throw new IllegalArgumentException("Payment request cannot be null");
        }
        if (paymentRequest.getAmount() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than 0");
        }
        if (paymentRequest.getCurrency() == null || paymentRequest.getCurrency().trim().isEmpty()) {
            throw new IllegalArgumentException("Currency is required");
        }
        if (paymentRequest.getDescription() == null || paymentRequest.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (paymentRequest.getSuccessUrl() == null || paymentRequest.getSuccessUrl().trim().isEmpty()) {
            throw new IllegalArgumentException("Success URL is required");
        }
        if (paymentRequest.getCancelUrl() == null || paymentRequest.getCancelUrl().trim().isEmpty()) {
            throw new IllegalArgumentException("Cancel URL is required");
        }
        
        Amount amount = new Amount();
        amount.setCurrency(paymentRequest.getCurrency());
        amount.setTotal(String.format(Locale.forLanguageTag(paymentRequest.getCurrency()), "%.2f", paymentRequest.getAmount()));

        Transaction transaction = new Transaction();
        transaction.setDescription(paymentRequest.getDescription());
        transaction.setAmount(amount);

        List<Transaction> transactions = new ArrayList<>();
        transactions.add(transaction);

        Payer payer = new Payer();
        payer.setPaymentMethod("paypal");

        Payment payment = new Payment();
        payment.setIntent("sale");
        payment.setPayer(payer);
        payment.setTransactions(transactions);

        RedirectUrls redirectUrls = new RedirectUrls();
        redirectUrls.setCancelUrl(paymentRequest.getCancelUrl());
        redirectUrls.setReturnUrl(paymentRequest.getSuccessUrl());
        payment.setRedirectUrls(redirectUrls);

        APIContext apiContext = new APIContext(clientId, clientSecret, mode);
        Payment createdPayment = payment.create(apiContext);

        PayPalPaymentResponse response = new PayPalPaymentResponse();
        response.setPaymentId(createdPayment.getId());
        response.setStatus(createdPayment.getState());

        for (Links link : createdPayment.getLinks()) {
            if (link.getRel().equals("approval_url")) {
                response.setApprovalUrl(link.getHref());
            }
        }

        return response;
    }

    public Payment executePayment(String paymentId, String payerId) throws PayPalRESTException {
        if (paymentId == null || paymentId.trim().isEmpty()) {
            throw new IllegalArgumentException("Payment ID is required");
        }
        if (payerId == null || payerId.trim().isEmpty()) {
            throw new IllegalArgumentException("Payer ID is required");
        }
        
        Payment payment = new Payment();
        payment.setId(paymentId);

        PaymentExecution paymentExecute = new PaymentExecution();
        paymentExecute.setPayerId(payerId);

        APIContext apiContext = new APIContext(clientId, clientSecret, mode);
        return payment.execute(apiContext, paymentExecute);
    }

    public Payment getPaymentDetails(String paymentId) throws PayPalRESTException {
        if (paymentId == null || paymentId.trim().isEmpty()) {
            throw new IllegalArgumentException("Payment ID is required");
        }
        
        APIContext apiContext = new APIContext(clientId, clientSecret, mode);
        return Payment.get(apiContext, paymentId);
    }
}