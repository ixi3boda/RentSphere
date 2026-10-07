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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Arrays;
import java.util.UUID;

/**
 * Business-logic layer for contract and payment operations.
 *
 * <p>A contract is auto-created when a property owner accepts a rental request
 * ({@link #createContractForApprovedRequest}). The method also writes one
 * {@code payments} row per contract month so that the installment schedule is
 * fully materialised at creation time.
 *
 * <p>Two payment paths are supported:
 * <ul>
 *   <li><strong>PayPal</strong> - two-step: {@link #createPayPalPaymentForContract}
 *       returns an approval URL; after the user approves in PayPal,
 *       {@link #executePayPalPaymentForContract} captures the money, verifies the
 *       captured amount matches the installment due, and marks the row PAID.</li>
 *   <li><strong>Credit card (mock)</strong> - one-step:
 *       {@link #processCreditCardPaymentForContract} validates card details and records
 *       a synthetic transaction reference. No real card network is contacted.</li>
 * </ul>
 *
 * <p>When the last outstanding installment is settled, the contract is automatically
 * moved to {@code COMPLETED} by {@link #settleIfFullyPaid}.
 *
 * <p>The {@code PAYMENT_RECEIVED} notification type is the only value allowed by the
 * {@code chk_noti_type} database CHECK constraint for payment events. Using any other
 * string would roll back the payment transaction at the JDBC layer.
 */
@Service
@RequiredArgsConstructor
public class ContractService {

    // chk_noti_type in Database/Schema.sql rejects anything outside its enum, and the check runs
    // inside the payment transaction - an unknown type rolls the paid installment back.
    private static final String PAYMENT_NOTIFICATION_TYPE = "PAYMENT_RECEIVED";

    // Rent is priced in one currency. Letting the client pick it would let a tenant settle a
    // 1,000 USD installment with 1,000 of something cheaper.
    private static final String CURRENCY = "USD";

    // PayPal sends the payer back to these URLs, so they may only point at our own frontend.
    @Value("${rentsphere.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins = "http://localhost:3000";

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
                                                                Long actorUserId) throws PayPalRESTException {
        if (request == null) {
            throw new IllegalArgumentException("Payment details are required");
        }
        requirePayableContract(contractId, actorUserId);
        requireOwnOrigin(request.getSuccessUrl(), "Success URL");
        requireOwnOrigin(request.getCancelUrl(), "Cancel URL");
        PaymentDto pendingPayment = requireOutstandingInstallment(contractId, request.getInstallmentNo());

        PayPalPaymentRequest paypalRequest = PayPalPaymentRequest.builder()
                .amount(pendingPayment.getAmountDue().doubleValue())
                .currency(CURRENCY)
                .description("Rent payment for contract #" + contractId + " installment #" + pendingPayment.getInstallmentNo())
                .cancelUrl(request.getCancelUrl())
                .successUrl(request.getSuccessUrl())
                .installmentNo(pendingPayment.getInstallmentNo())
                .build();

        return payPalService.createPayment(paypalRequest);
    }

    @Transactional
    public PayPalPaymentResponse executePayPalPaymentForContract(Long contractId, String paymentId, String payerId,
                                                                 Integer installmentNo, Long actorUserId) throws PayPalRESTException {
        Contract contract = requirePayableContract(contractId, actorUserId);
        // Checked before PayPal is asked to capture, so money never moves for an installment
        // that is not owed.
        requireOutstandingInstallment(contractId, installmentNo);
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
                    paymentTitle(contractId, targetPayment.getInstallmentNo()),
                    String.format("Your payment of $%.2f for installment #%d on contract #%d was successfully completed.",
                            targetPayment.getAmountDue(), targetPayment.getInstallmentNo(), contractId)
            );

            settleIfFullyPaid(contractId);
        }

        return response;
    }

    @Transactional
    public CreditCardPaymentResponse processCreditCardPaymentForContract(Long contractId, CreditCardPaymentRequest request,
                                                                        Long actorUserId) {
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
        if (isExpired(request.getExpiryMonth(), request.getExpiryYear())) {
            throw new IllegalArgumentException("This card has expired.");
        }

        Contract contract = requirePayableContract(contractId, actorUserId);
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
                paymentTitle(contractId, targetPayment.getInstallmentNo()),
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

    // Notifications are deduplicated per (recipient, type, title), so the title has to name the
    // installment or a tenant would only ever be told about their first payment.
    private static String paymentTitle(Long contractId, Integer installmentNo) {
        return "Payment received: contract #" + contractId + ", installment #" + installmentNo;
    }

    // Expiry is optional on the request; when present it must not be in the past.
    private static boolean isExpired(String month, String year) {
        if (month == null || year == null || !month.matches("\\d{1,2}") || !year.matches("\\d{2}|\\d{4}")) {
            return false;
        }
        int fullYear = year.length() == 2 ? 2000 + Integer.parseInt(year) : Integer.parseInt(year);
        int monthValue = Integer.parseInt(month);
        if (monthValue < 1 || monthValue > 12) {
            return true;
        }
        return YearMonth.of(fullYear, monthValue).isBefore(YearMonth.now());
    }

    private void requireOwnOrigin(String url, String label) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException(label + " is required");
        }
        boolean allowed = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .anyMatch(origin -> url.equals(origin) || url.startsWith(origin + "/"));
        if (!allowed) {
            throw new IllegalArgumentException(label + " must point back to this site");
        }
    }

    /**
     * Only the tenant on the contract may move money on it, and a cancelled or completed
     * contract must never accept a payment.
     */
    private Contract requirePayableContract(Long contractId, Long actorUserId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));
        if (!contract.getTenantId().equals(actorUserId)) {
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
        String currency = payment.getTransactions().get(0).getAmount().getCurrency();
        if (!CURRENCY.equalsIgnoreCase(currency)) {
            throw new PaymentProcessingException("Payment " + payment.getId() + " was captured in "
                    + currency + " but rent is due in " + CURRENCY);
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

    public java.util.List<Contract> getContracts(Long ownerId, String status, int limit, int offset) {
        return contractRepository.findAllForOwner(ownerId, status, limit, offset);
    }

    public int countContracts(Long ownerId, String status) {
        return contractRepository.countContractsForOwner(ownerId, status);
    }

    public java.util.Map<String, Integer> contractStatusCounts(Long ownerId) {
        return contractRepository.countContractsByStatusForOwner(ownerId);
    }

    public java.util.List<Contract> getContractsForTenant(Long tenantId) {
        return contractRepository.findByTenantId(tenantId);
    }

    public java.util.List<Contract> getContractsForOwner(Long ownerId) {
        return contractRepository.findByOwnerId(ownerId);
    }

    /**
     * The payment schedule is visible to the tenant who owes it and the landlord whose rent it is.
     */
    public java.util.List<PaymentDto> getPaymentsByContractId(Long contractId, Long actorUserId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));
        boolean party = contract.getTenantId().equals(actorUserId) || contract.getOwnerId().equals(actorUserId);
        if (!party) {
            throw new AccessDeniedException("Contract #" + contractId + " does not belong to the authenticated user");
        }
        return contractRepository.findPaymentsByContractId(contractId);
    }

    public int countActiveContracts() {
        return contractRepository.countContractsByStatus("ACTIVE");
    }
}
