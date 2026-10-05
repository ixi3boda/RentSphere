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

        // 3-day and 1-day advance payment reminders
        createPaymentReminders(today.plusDays(3), 3);
        createPaymentReminders(today.plusDays(1), 1);
        createPaymentReminders(today, 0);

        cancelOverdueContracts(today);
        completeFinishedContracts(today);
    }

    private void createPaymentReminders(LocalDate dueDate, int daysLeft) {
        List<PaymentDueInfo> duePayments = contractRepository.findPaymentsDueOn(dueDate);
        for (PaymentDueInfo duePayment : duePayments) {
            String title = daysLeft == 0 ? "⚠️ Rent Payment Due Today" : String.format("⏰ Rent Payment Due in %d Days", daysLeft);
            String body = String.format("Your rent installment #%d of $%.2f for contract #%d is due on %s. Please submit payment to prevent late penalties.",
                    duePayment.getInstallmentNo(), duePayment.getAmountDue(), duePayment.getContractId(), duePayment.getDueDate());
            notificationService.createNotification(duePayment.getTenantId(), "PAYMENT_REMINDER", title, body);
        }
    }

    private void cancelOverdueContracts(LocalDate today) {
        List<Contract> overdueContracts = contractRepository.findActiveContractsWithPastDuePendingPayments(today);
        for (Contract contract : overdueContracts) {
            contractRepository.markPaymentsOverdueByContract(contract.getContractId());
            contractRepository.cancelContract(contract.getContractId());
            String title = "Contract Cancelled - Overdue Rent";
            String body = String.format("Contract #%d has been automatically cancelled because a monthly installment was not settled by its due date.", contract.getContractId());
            notificationService.createNotification(contract.getTenantId().intValue(), "REQUEST_CANCELLED", title, body);
        }
    }

    private void completeFinishedContracts(LocalDate today) {
        List<Contract> completedContracts = contractRepository.findActiveContractsToComplete(today);
        for (Contract contract : completedContracts) {
            contractRepository.completeContract(contract.getContractId());
            String title = "Contract Completed Successfully";
            String body = String.format("Contract #%d has concluded. All installments have been fully paid and the lease term has expired.", contract.getContractId());
            notificationService.createNotification(contract.getTenantId().intValue(), "CONTRACT_COMPLETED", title, body);
        }
    }
}
