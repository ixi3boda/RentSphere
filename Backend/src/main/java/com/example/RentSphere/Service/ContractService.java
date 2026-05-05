package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.Contract;
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

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final PayPalService payPalService;

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
        PaymentDto pendingPayment = contractRepository.findNextPendingPayment(contractId)
                .orElseThrow(() -> new IllegalArgumentException("No pending payment found for contract"));

        PayPalPaymentRequest paypalRequest = PayPalPaymentRequest.builder()
                .amount(pendingPayment.getAmountDue().doubleValue())
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .description(request.getDescription() != null ? request.getDescription() : "Rent payment for contract " + contractId + " installment " + pendingPayment.getInstallmentNo())
                .cancelUrl(request.getCancelUrl())
                .successUrl(request.getSuccessUrl())
                .build();

        return payPalService.createPayment(paypalRequest);
    }

    @Transactional
    public PayPalPaymentResponse executePayPalPaymentForContract(Long contractId, String paymentId, String payerId) throws PayPalRESTException {
        PayPalPaymentResponse response = new PayPalPaymentResponse();
        Payment payment = payPalService.executePayment(paymentId, payerId);
        if (payment == null || payment.getState() == null) {
            throw new RuntimeException("PayPal payment execution failed");
        }
        response.setPaymentId(payment.getId());
        response.setStatus(payment.getState());
        response.setApprovalUrl(null);

        if ("approved".equalsIgnoreCase(payment.getState()) || "completed".equalsIgnoreCase(payment.getState())) {
            PaymentDto pendingPayment = contractRepository.findNextPendingPayment(contractId)
                    .orElseThrow(() -> new IllegalArgumentException("No pending payment found to mark as paid"));
            contractRepository.markPaymentPaid(contractId, pendingPayment.getInstallmentNo(), pendingPayment.getAmountDue(), payment.getId());
            if (contractRepository.countPendingPayments(contractId) == 0) {
                contractRepository.completeContract(contractId);
            }
        }

        return response;
    }

    public java.util.List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }
}
