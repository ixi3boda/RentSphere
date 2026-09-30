package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.Contract;
import com.example.RentSphere.Dto.CreditCardPaymentRequest;
import com.example.RentSphere.Dto.CreditCardPaymentResponse;
import com.example.RentSphere.Dto.PayPalPaymentRequest;
import com.example.RentSphere.Dto.PayPalPaymentResponse;
import com.example.RentSphere.Dto.PaymentDto;
import com.example.RentSphere.Dto.PropertyDetails;
import com.example.RentSphere.Dto.RentalRequest;
import com.example.RentSphere.Exception.BadRequestException;
import com.example.RentSphere.Exception.PaymentProcessingException;
import com.example.RentSphere.Exception.ResourceNotFoundException;
import com.example.RentSphere.Repository.ContractRepository;
import com.example.RentSphere.Repository.UserRepository;
import com.paypal.api.payments.Payment;
import com.paypal.base.rest.PayPalRESTException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContractService {

    // chk_noti_type in Database/Schema.sql rejects anything outside its enum, and the check runs
    // inside the payment transaction — an unknown type rolls the paid installment back.
    private static final String PAYMENT_NOTIFICATION_TYPE = "PAYMENT_RECEIVED";

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
        userRepository.promoteVisitorToTenant(request.getTenantId().intValue());
        return saved;
    }

    public PayPalPaymentResponse createPayPalPaymentForContract(Long contractId, PayPalPaymentRequest request,
                                                                Long actorUserId, boolean actorIsAdmin) throws PayPalRESTException {
        Contract contract = requirePayableContract(contractId, actorUserId, actorIsAdmin);
        PaymentDto pendingPayment = requireOutstandingInstallment(contractId, request != null ? request.getInstallmentNo() : null);

        PayPalPaymentRequest paypalRequest = PayPalPaymentRequest.builder()
                .amount(pendingPayment.getAmountDue().doubleValue())
                .currency(request != null && request.getCurrency() != null ? request.getCurrency() : "USD")
                .description("Rent payment for contract #" + contractId + " installment #" + pendingPayment.getInstallmentNo())
                .cancelUrl(request != null ? request.getCancelUrl() : null)
                .successUrl(request != null ? request.getSuccessUrl() : null)
                .installmentNo(pendingPayment.getInstallmentNo())
                .build();

        return payPalService.createPayment(paypalRequest);
    }

    @Transactional
    public PayPalPaymentResponse executePayPalPaymentForContract(Long contractId, String paymentId, String payerId,
                                                                 Integer installmentNo, Long actorUserId, boolean actorIsAdmin) throws PayPalRESTException {
        Contract contract = requirePayableContract(contractId, actorUserId, actorIsAdmin);
        Payment payment = payPalService.executePayment(paymentId, payerId);
        if (payment == null || payment.getState() == null) {
            throw new PaymentProcessingException("PayPal payment execution failed");
        }

        PayPalPaymentResponse response = new PayPalPaymentResponse();
        response.setPaymentId(payment.getId());
        response.setStatus(payment.getState());
        response.setApprovalUrl(null);

        if ("approved".equalsIgnoreCase(payment.getState()) || "completed".equalsIgnoreCase(payment.getState())) {
            PaymentDto targetPayment = requireOutstandingInstallment(contractId, installmentNo);
            requireCapturedAmountMatchesDue(payment, targetPayment, contractId);

            if (contractRepository.markPaymentPaid(contractId, targetPayment.getInstallmentNo(),
                    targetPayment.getAmountDue(), payment.getId()) != 1) {
                throw new PaymentProcessingException("Installment #" + targetPayment.getInstallmentNo()
                        + " on contract #" + contractId + " could not be recorded as paid");
            }

            notificationService.createNotification(
                    contract.getTenantId().intValue(),
                    PAYMENT_NOTIFICATION_TYPE,
                    "Payment Received via PayPal",
                    String.format("Your payment of $%.2f for installment #%d on contract #%d was successfully completed.",
                            targetPayment.getAmountDue(), targetPayment.getInstallmentNo(), contractId)
            );

            settleIfFullyPaid(contractId);
        }

        return response;
    }

    @Transactional
    public CreditCardPaymentResponse processCreditCardPaymentForContract(Long contractId, CreditCardPaymentRequest request,
                                                                        Long actorUserId, boolean actorIsAdmin) {
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

        Contract contract = requirePayableContract(contractId, actorUserId, actorIsAdmin);
        PaymentDto targetPayment = requireOutstandingInstallment(contractId, request.getInstallmentNo());

        String transactionRef = "CC-PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        if (contractRepository.markPaymentPaid(contractId, targetPayment.getInstallmentNo(),
                targetPayment.getAmountDue(), transactionRef) != 1) {
            throw new PaymentProcessingException("Installment #" + targetPayment.getInstallmentNo()
                    + " on contract #" + contractId + " could not be recorded as paid");
        }

        notificationService.createNotification(
                contract.getTenantId().intValue(),
                PAYMENT_NOTIFICATION_TYPE,
                "Payment Received via Credit Card",
                String.format("Your payment of $%.2f for installment #%d on contract #%d was successfully processed via Credit Card (%s).",
                        targetPayment.getAmountDue(), targetPayment.getInstallmentNo(), contractId, transactionRef)
        );

        settleIfFullyPaid(contractId);

        return CreditCardPaymentResponse.builder()
                .transactionRef(transactionRef)
                .status("PAID")
                .message("Credit Card payment processed successfully.")
                .installmentNo(targetPayment.getInstallmentNo())
                .amountPaid(targetPayment.getAmountDue())
                .paidDate(LocalDateTime.now())
                .build();
    }

    /**
     * Only the tenant on the contract (or an administrator) may move money on it, and a
     * cancelled or completed contract must never accept a payment.
     */
    private Contract requirePayableContract(Long contractId, Long actorUserId, boolean actorIsAdmin) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));
        if (!actorIsAdmin && !contract.getTenantId().equals(actorUserId)) {
            throw new AccessDeniedException("Contract #" + contractId + " does not belong to the authenticated user");
        }
        if (!"ACTIVE".equalsIgnoreCase(contract.getContractStatus())) {
            throw new AccessDeniedException("Contract #" + contractId + " is " + contract.getContractStatus()
                    + " and cannot accept payments");
        }
        return contract;
    }

    private PaymentDto requireOutstandingInstallment(Long contractId, Integer installmentNo) {
        if (installmentNo != null && installmentNo > 0) {
            return contractRepository.findPendingPaymentByInstallmentNo(contractId, installmentNo)
                    .orElseThrow(() -> new BadRequestException("Installment #" + installmentNo
                            + " is not outstanding on contract #" + contractId));
        }
        return contractRepository.findNextPendingPayment(contractId)
                .orElseThrow(() -> new BadRequestException("No outstanding installment on contract #" + contractId));
    }

    /**
     * The client names the installment at execute time, so the only thing tying the money that
     * actually arrived to the row we mark paid is this comparison.
     */
    private void requireCapturedAmountMatchesDue(Payment payment, PaymentDto targetPayment, Long contractId) {
        if (payment.getTransactions() == null || payment.getTransactions().isEmpty()
                || payment.getTransactions().get(0).getAmount() == null
                || payment.getTransactions().get(0).getAmount().getTotal() == null) {
            throw new PaymentProcessingException("PayPal did not report a captured amount for payment " + payment.getId());
        }
        BigDecimal captured = new BigDecimal(payment.getTransactions().get(0).getAmount().getTotal());
        if (captured.compareTo(targetPayment.getAmountDue()) != 0) {
            throw new PaymentProcessingException(String.format(
                    "Captured $%.2f but installment #%d on contract #%d is due $%.2f",
                    captured, targetPayment.getInstallmentNo(), contractId, targetPayment.getAmountDue()));
        }
    }

    private void settleIfFullyPaid(Long contractId) {
        if (contractRepository.countUnsettledPayments(contractId) == 0) {
            contractRepository.completeContract(contractId);
        }
    }

    public java.util.List<Contract> getContracts(String status, int limit, int offset) {
        return contractRepository.findAll(status, limit, offset);
    }

    public int countContracts(String status) {
        return contractRepository.countContracts(status);
    }

    public java.util.Map<String, Integer> contractStatusCounts() {
        return contractRepository.countContractsByStatus();
    }

    public java.util.List<Contract> getContractsForTenant(Long tenantId) {
        return contractRepository.findByTenantId(tenantId);
    }

    public java.util.List<Contract> getContractsForOwner(Long ownerId) {
        return contractRepository.findByOwnerId(ownerId);
    }

    /**
     * The payment schedule is visible to the tenant who owes it, the landlord whose rent it is,
     * and administrators.
     */
    public java.util.List<PaymentDto> getPaymentsByContractId(Long contractId, Long actorUserId, boolean actorIsAdmin) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));
        boolean party = contract.getTenantId().equals(actorUserId) || contract.getOwnerId().equals(actorUserId);
        if (!actorIsAdmin && !party) {
            throw new AccessDeniedException("Contract #" + contractId + " does not belong to the authenticated user");
        }
        return contractRepository.findPaymentsByContractId(contractId);
    }

    public int countActiveContracts() {
        return contractRepository.countContractsByStatus("ACTIVE");
    }
}
