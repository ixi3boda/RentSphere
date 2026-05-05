package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.Contract;
import com.example.RentSphere.Dto.PaymentDueInfo;
import com.example.RentSphere.Repository.ContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContractSchedulerService {

    private final ContractRepository contractRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 9 * * *")
    public void processContractEvents() {
        LocalDate today = LocalDate.now();
        LocalDate reminderDate = today.plusDays(1);

        createPaymentReminders(reminderDate);
        cancelOverdueContracts(today);
        completeFinishedContracts(today);
    }

    private void createPaymentReminders(LocalDate dueDate) {
        List<PaymentDueInfo> duePayments = contractRepository.findPaymentsDueOn(dueDate);
        for (PaymentDueInfo duePayment : duePayments) {
            String title = "Rent payment due soon";
            String body = String.format("Your rent installment %d for contract %d is due on %s.",
                    duePayment.getInstallmentNo(), duePayment.getContractId(), duePayment.getDueDate());
            notificationService.createNotification(duePayment.getTenantId(), "PAYMENT_REMINDER", title, body);
        }
    }

    private void cancelOverdueContracts(LocalDate today) {
        List<Contract> overdueContracts = contractRepository.findActiveContractsWithPastDuePendingPayments(today);
        for (Contract contract : overdueContracts) {
            contractRepository.markPaymentsOverdueByContract(contract.getContractId());
            contractRepository.cancelContract(contract.getContractId());
            String title = "Contract cancelled due to overdue rent";
            String body = String.format("Contract %d has been cancelled because an installment was not paid by its due date.", contract.getContractId());
            notificationService.createNotification(contract.getTenantId().intValue(), "REQUEST_CANCELLED", title, body);
        }
    }

    private void completeFinishedContracts(LocalDate today) {
        List<Contract> completedContracts = contractRepository.findActiveContractsToComplete(today);
        for (Contract contract : completedContracts) {
            contractRepository.completeContract(contract.getContractId());
            String title = "Contract completed";
            String body = String.format("Contract %d is now completed because all payments are paid and the contract end date has passed.", contract.getContractId());
            notificationService.createNotification(contract.getTenantId().intValue(), "CONTRACT_COMPLETED", title, body);
        }
    }
}
