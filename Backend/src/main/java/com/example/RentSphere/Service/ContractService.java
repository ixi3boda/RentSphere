package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.Contract;
import com.example.RentSphere.Dto.CreditCardPaymentRequest;
import com.example.RentSphere.Dto.CreditCardPaymentResponse;
import com.example.RentSphere.Dto.PayPalPaymentRequest;
import com.example.RentSphere.Dto.PayPalPaymentResponse;
import com.example.RentSphere.Dto.PaymentDto;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.RentalRequest;
import com.example.RentSphere.Repository.ContractRepository;
import com.example.RentSphere.Repository.UserRepository;
import com.paypal.api.payments.Payment;
import com.paypal.base.rest.PayPalRESTException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final PayPalService payPalService;
    private final NotificationService notificationService;

    @Transactional
    public Contract createContractForApprovedRequest(RentalRequest request, PropertyDetails propertyDetails) {
        if (request == null) {
            throw new IllegalArgumentException("Rental request is required");
        }
        if (propertyDetails == null || propertyDetails.getProperty() == null) {
            throw new IllegalArgumentException("Property details are required to create a contract");
        }
        var property = propertyDetails.getProperty();
        LocalDate startDate = request.getDesiredStart() != null ? request.getDesiredStart() : LocalDate.now();
        LocalDate endDate = startDate.plusMonths(request.getDesiredMonths() != null && request.getDesiredMonths() > 0 ? request.getDesiredMonths() : 1);

        Contract contract = Contract.builder()
                .rentalRequestId(request.getRentalReqId())
                .propertyId(property.getPropertyId())
                .ownerId(property.getOwnerId())
                .tenantId(request.getTenantId())
                .contractStatus("ACTIVE")
                .rentAmount(property.getPricePerMonth())
                .durationMonths(request.getDesiredMonths() != null && request.getDesiredMonths() > 0 ? request.getDesiredMonths() : 1)
                .startDate(startDate)
                .endDate(endDate)
                .notes("Auto-generated contract after rental approval")
                .build();

        Contract saved = contractRepository.createContract(contract);
        contractRepository.createPaymentSchedule(saved.getContractId(), saved.getRentAmount(), saved.getDurationMonths(), saved.getStartDate());
        userRepository.updateRole(request.getTenantId().intValue(), "TENANT");
        return saved;
    }

    public PayPalPaymentResponse createPayPalPaymentForContract(Long contractId, PayPalPaymentRequest request) throws PayPalRESTException {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found"));
        
        PaymentDto pendingPayment;
        if (request != null && request.getInstallmentNo() != null && request.getInstallmentNo() > 0) {
            pendingPayment = contractRepository.findPendingPaymentByInstallmentNo(contractId, request.getInstallmentNo())
                    .orElseThrow(() -> new IllegalArgumentException("Pending installment #" + request.getInstallmentNo() + " not found for contract #" + contractId));
        } else {
            pendingPayment = contractRepository.findNextPendingPayment(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("No pending payment found for contract"));
        }

        PayPalPaymentRequest paypalRequest = PayPalPaymentRequest.builder()
                .amount(pendingPayment.getAmountDue().doubleValue())
                .currency(request != null && request.getCurrency() != null ? request.getCurrency() : "USD")
                .description(request != null && request.getDescription() != null ? request.getDescription() : "Rent payment for contract #" + contractId + " installment #" + pendingPayment.getInstallmentNo())
                .cancelUrl(request != null ? request.getCancelUrl() : null)
                .successUrl(request != null ? request.getSuccessUrl() : null)
                .installmentNo(pendingPayment.getInstallmentNo())
                .build();

        return payPalService.createPayment(paypalRequest);
    }

    @Transactional
    public PayPalPaymentResponse executePayPalPaymentForContract(Long contractId, String paymentId, String payerId, Integer installmentNo) throws PayPalRESTException {
        PayPalPaymentResponse response = new PayPalPaymentResponse();
        Payment payment = payPalService.executePayment(paymentId, payerId);
        if (payment == null || payment.getState() == null) {
            throw new RuntimeException("PayPal payment execution failed");
        }
        response.setPaymentId(payment.getId());
        response.setStatus(payment.getState());
        response.setApprovalUrl(null);

        if ("approved".equalsIgnoreCase(payment.getState()) || "completed".equalsIgnoreCase(payment.getState())) {
            PaymentDto targetPayment;
            if (installmentNo != null && installmentNo > 0) {
                targetPayment = contractRepository.findPendingPaymentByInstallmentNo(contractId, installmentNo)
                        .orElseGet(() -> contractRepository.findNextPendingPayment(contractId)
                                .orElseThrow(() -> new IllegalArgumentException("No pending payment found to mark as paid")));
            } else {
                targetPayment = contractRepository.findNextPendingPayment(contractId)
                        .orElseThrow(() -> new IllegalArgumentException("No pending payment found to mark as paid"));
            }

            contractRepository.markPaymentPaid(contractId, targetPayment.getInstallmentNo(), targetPayment.getAmountDue(), payment.getId());
            
            Contract contract = contractRepository.findById(contractId).orElse(null);
            if (contract != null) {
                notificationService.createNotification(
                        contract.getTenantId().intValue(),
                        "PAYMENT_CONFIRMED",
                        "Payment Received via PayPal",
                        String.format("Your payment of $%.2f for installment #%d on contract #%d was successfully completed.",
                                targetPayment.getAmountDue(), targetPayment.getInstallmentNo(), contractId)
                );
            }

            if (contractRepository.countPendingPayments(contractId) == 0) {
                contractRepository.completeContract(contractId);
            }
        }

        return response;
    }

    @Transactional
    public CreditCardPaymentResponse processCreditCardPaymentForContract(Long contractId, CreditCardPaymentRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Credit card payment details are required");
        }
        
        String cardNumber = request.getCardNumber() != null ? request.getCardNumber().replaceAll("\\s|-", "") : "";
        if (!cardNumber.matches("\\d{13,19}")) {
            throw new IllegalArgumentException("Invalid credit card number. Must be between 13 and 19 digits.");
        }
        if (request.getCardHolderName() == null || request.getCardHolderName().trim().isEmpty()) {
            throw new IllegalArgumentException("Cardholder name is required.");
        }
        if (request.getCvv() == null || !request.getCvv().matches("\\d{3,4}")) {
            throw new IllegalArgumentException("Invalid CVV code. Must be 3 or 4 digits.");
        }

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contract not found with ID #" + contractId));

        PaymentDto targetPayment;
        if (request.getInstallmentNo() != null && request.getInstallmentNo() > 0) {
            targetPayment = contractRepository.findPendingPaymentByInstallmentNo(contractId, request.getInstallmentNo())
                    .orElseThrow(() -> new IllegalArgumentException("Pending installment #" + request.getInstallmentNo() + " not found for contract #" + contractId));
        } else {
            targetPayment = contractRepository.findNextPendingPayment(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("No pending payment found for contract #" + contractId));
        }

        String transactionRef = "CC-PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        contractRepository.markPaymentPaid(contractId, targetPayment.getInstallmentNo(), targetPayment.getAmountDue(), transactionRef);

        notificationService.createNotification(
                contract.getTenantId().intValue(),
                "PAYMENT_CONFIRMED",
                "Payment Received via Credit Card",
                String.format("Your payment of $%.2f for installment #%d on contract #%d was successfully processed via Credit Card (%s).",
                        targetPayment.getAmountDue(), targetPayment.getInstallmentNo(), contractId, transactionRef)
        );

        if (contractRepository.countPendingPayments(contractId) == 0) {
            contractRepository.completeContract(contractId);
        }

        return CreditCardPaymentResponse.builder()
                .transactionRef(transactionRef)
                .status("PAID")
                .message("Credit Card payment processed successfully.")
                .installmentNo(targetPayment.getInstallmentNo())
                .amountPaid(targetPayment.getAmountDue())
                .paidDate(LocalDateTime.now())
                .build();
    }

    public java.util.List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    public java.util.List<Contract> getContractsForTenant(Long tenantId) {
        return contractRepository.findByTenantId(tenantId);
    }

    public java.util.List<Contract> getContractsForOwner(Long ownerId) {
        return contractRepository.findByOwnerId(ownerId);
    }

    public java.util.List<PaymentDto> getPaymentsByContractId(Long contractId) {
        return contractRepository.findPaymentsByContractId(contractId);
    }
}
