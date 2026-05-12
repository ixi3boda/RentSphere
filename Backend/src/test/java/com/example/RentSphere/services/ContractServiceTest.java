package com.example.RentSphere.services;

import com.example.RentSphere.Dto.*;
import com.example.RentSphere.Repository.ContractRepository;
import com.example.RentSphere.Repository.UserRepository;
import com.example.RentSphere.Service.ContractService;
import com.example.RentSphere.Service.PayPalService;
import com.example.RentSphere.fixtures.TestFixtures;
import com.paypal.api.payments.Payment;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ContractService Unit Tests")
class ContractServiceTest {

    @Mock
    private ContractRepository contractRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PayPalService payPalService;

    @InjectMocks
    private ContractService contractService;

    @Test
    @DisplayName("createContractForApprovedRequest — throws when request is null")
    void createContract_nullRequest_throws() {
        assertThatThrownBy(() -> contractService.createContractForApprovedRequest(null, new PropertyDetails()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Rental request is required");
    }

    @Test
    @DisplayName("createContractForApprovedRequest — throws when propertyDetails is null")
    void createContract_nullPropertyDetails_throws() {
        assertThatThrownBy(() -> contractService.createContractForApprovedRequest(new RentalRequest(), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Property details are required");
    }

    @Test
    @DisplayName("createContractForApprovedRequest — succeeds and delegates correctly")
    void createContract_succeeds() {
        RentalRequest req = TestFixtures.pendingRentalRequest();
        req.setDesiredMonths(12);

        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(TestFixtures.testProperty());

        Contract savedContract = TestFixtures.activeContract();
        savedContract.setContractId(1L);
        when(contractRepository.createContract(any())).thenReturn(savedContract);

        Contract result = contractService.createContractForApprovedRequest(req, pd);

        assertThat(result.getContractStatus()).isEqualTo("ACTIVE");
        verify(contractRepository).createContract(any());
        verify(contractRepository).createPaymentSchedule(eq(1L), any(BigDecimal.class), eq(12), any());
        verify(userRepository).updateRole(eq(2), eq("TENANT"));
    }

    @Test
    @DisplayName("createPayPalPaymentForContract — throws when contract not found")
    void createPayPalPayment_contractNotFound_throws() {
        when(contractRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> contractService.createPayPalPaymentForContract(999L, new PayPalPaymentRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Contract not found");
    }

    @Test
    @DisplayName("createPayPalPaymentForContract — throws when no pending payments")
    void createPayPalPayment_noPendingPayments_throws() {
        when(contractRepository.findById(1L)).thenReturn(Optional.of(TestFixtures.activeContract()));
        when(contractRepository.findNextPendingPayment(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contractService.createPayPalPaymentForContract(1L, new PayPalPaymentRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No pending payment found");
    }

    @Test
    @DisplayName("createPayPalPaymentForContract — succeeds and delegates to PayPalService")
    void createPayPalPayment_succeeds() throws Exception {
        Contract contract = TestFixtures.activeContract();
        when(contractRepository.findById(1L)).thenReturn(Optional.of(contract));

        PaymentDto paymentDto = new PaymentDto();
        paymentDto.setAmountDue(new BigDecimal("1500.00"));
        paymentDto.setInstallmentNo(1);
        when(contractRepository.findNextPendingPayment(1L)).thenReturn(Optional.of(paymentDto));

        PayPalPaymentResponse mockResponse = new PayPalPaymentResponse();
        when(payPalService.createPayment(any())).thenReturn(mockResponse);

        PayPalPaymentRequest req = new PayPalPaymentRequest();
        req.setCurrency("USD");
        PayPalPaymentResponse response = contractService.createPayPalPaymentForContract(1L, req);

        assertThat(response).isNotNull();
        verify(payPalService).createPayment(any());
    }

    @Test
    @DisplayName("executePayPalPaymentForContract — throws when payment fails")
    void executePayPalPayment_paymentFails_throws() throws Exception {
        when(payPalService.executePayment(anyString(), anyString())).thenReturn(null);

        assertThatThrownBy(() -> contractService.executePayPalPaymentForContract(1L, "payId", "payerId"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("execution failed");
    }

    @Test
    @DisplayName("executePayPalPaymentForContract — updates DB when approved")
    void executePayPalPayment_approved_updatesDB() throws Exception {
        Payment mockPayment = new Payment();
        mockPayment.setId("PAY-123");
        mockPayment.setState("approved");
        when(payPalService.executePayment("payId", "payerId")).thenReturn(mockPayment);

        PaymentDto pendingPayment = new PaymentDto();
        pendingPayment.setAmountDue(new BigDecimal("1500.00"));
        pendingPayment.setInstallmentNo(1);
        when(contractRepository.findNextPendingPayment(1L)).thenReturn(Optional.of(pendingPayment));
        when(contractRepository.countPendingPayments(1L)).thenReturn(0);

        PayPalPaymentResponse response = contractService.executePayPalPaymentForContract(1L, "payId", "payerId");

        assertThat(response.getStatus()).isEqualTo("approved");
        verify(contractRepository).markPaymentPaid(eq(1L), eq(1), eq(new BigDecimal("1500.00")), eq("PAY-123"));
        verify(contractRepository).completeContract(1L);
    }
}
