package com.example.RentSphere.services;

import com.example.RentSphere.Dto.Contract;
import com.example.RentSphere.Dto.PaymentDueInfo;
import com.example.RentSphere.Repository.ContractRepository;
import com.example.RentSphere.Service.ContractSchedulerService;
import com.example.RentSphere.Service.NotificationService;
import com.example.RentSphere.fixtures.TestFixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ContractSchedulerService Unit Tests")
class ContractSchedulerServiceTest {

        @Mock
        private ContractRepository contractRepository;

        @Mock
        private NotificationService notificationService;

        @InjectMocks
        private ContractSchedulerService schedulerService;

        @Test
        @DisplayName("processContractEvents — handles reminders, cancellations, and completions")
        void processContractEvents_runsAllTasks() {

                LocalDate today = LocalDate.now();
                LocalDate tomorrow = today.plusDays(1);

                PaymentDueInfo duePayment = PaymentDueInfo.builder()
                                .contractId(101L)
                                .tenantId(2)
                                .installmentNo(1)
                                .dueDate(tomorrow)
                                .build();

                Contract overdueContract = TestFixtures.activeContract();
                overdueContract.setContractId(202L);
                overdueContract.setTenantId(2L);

                Contract finishedContract = TestFixtures.activeContract();
                finishedContract.setContractId(303L);
                finishedContract.setTenantId(2L);

                when(contractRepository.findPaymentsDueOn(tomorrow)).thenReturn(List.of(duePayment));
                when(contractRepository.findActiveContractsWithPastDuePendingPayments(today))
                                .thenReturn(List.of(overdueContract));
                when(contractRepository.findActiveContractsToComplete(today)).thenReturn(List.of(finishedContract));

                schedulerService.processContractEvents();

                verify(notificationService).createNotification(
                                eq(2), eq("PAYMENT_REMINDER"), anyString(), contains("installment 1"));

                verify(contractRepository).markPaymentsOverdueByContract(202L);
                verify(contractRepository).cancelContract(202L);
                verify(notificationService).createNotification(
                                eq(2), eq("REQUEST_CANCELLED"), anyString(), contains("Contract 202"));

                verify(contractRepository).completeContract(303L);
                verify(notificationService).createNotification(
                                eq(2), eq("CONTRACT_COMPLETED"), anyString(), contains("Contract 303"));
        }
}
