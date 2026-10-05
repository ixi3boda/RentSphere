package com.example.RentSphere.Service;

import com.example.RentSphere.Dto.Contract;
import com.example.RentSphere.Dto.PaymentDueInfo;
import com.example.RentSphere.Repository.ContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled service that drives the contract lifecycle without human intervention.
 *
 * <p>A single daily job ({@code @Scheduled(cron = "0 0 9 * * *")}) runs at 09:00 every
 * morning and performs three sweeps against the active contract and payment tables:
 * <ol>
 *   <li><strong>Payment reminders</strong> — sends in-app notifications to tenants whose
 *       next instalment is due in 3 days, 1 day, or today.</li>
 *   <li><strong>Overdue cancellation</strong> — marks instalments as OVERDUE and
 *       cancels contracts where a payment passed its due date without being settled.</li>
 *   <li><strong>Automatic completion</strong> — moves contracts to COMPLETED when the
 *       lease end date has passed and all instalments are paid.</li>
 * </ol>
 *
 * <p>All database writes go through {@link ContractRepository}, and all in-app
 * notifications go through {@link NotificationService} (which deduplicates by
 * recipient/type/title, so re-running the job manually is safe).
 *
 * <p>For the scheduler to fire, the application context must include
 * {@code @EnableScheduling} — this is declared on {@code RentSphereApplication}.
 */
@Service
@RequiredArgsConstructor
public class ContractSchedulerService {

    private final ContractRepository contractRepository;
    private final NotificationService notificationService;

    /**
     * Main scheduler entry point — runs every day at 09:00 server time.
     *
     * <p>The three sweeps are intentionally sequential so that a contract whose final
     * instalment is due today goes through the reminder sweep before the overdue sweep
     * has a chance to cancel it (the overdue sweep targets past-due dates, not today's).
     */
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

    /**
     * Sends a payment-reminder notification to the tenant for every instalment whose
     * due date equals {@code dueDate}.
     *
     * <p>The {@link NotificationService} deduplication ensures that tenants with
     * multiple active contracts each receive exactly one reminder per instalment,
     * and that re-running the sweep does not create duplicates.
     *
     * @param dueDate  the due date to query payments for
     * @param daysLeft number of days until the payment is due (0 = due today,
     *                 used to choose between "Due Today" and "Due in N Days" wording)
     */
    private void createPaymentReminders(LocalDate dueDate, int daysLeft) {
        List<PaymentDueInfo> duePayments = contractRepository.findPaymentsDueOn(dueDate);
        for (PaymentDueInfo duePayment : duePayments) {
            String title = daysLeft == 0 ? "⚠️ Rent Payment Due Today" : String.format("⏰ Rent Payment Due in %d Days", daysLeft);
            String body = String.format("Your rent installment #%d of $%.2f for contract #%d is due on %s. Please submit payment to prevent late penalties.",
                    duePayment.getInstallmentNo(), duePayment.getAmountDue(), duePayment.getContractId(), duePayment.getDueDate());
            notificationService.createNotification(duePayment.getTenantId(), "PAYMENT_REMINDER", title, body);
        }
    }

    /**
     * Cancels any ACTIVE contract that has at least one PENDING instalment whose due date
     * has passed. The cancelled instalment rows are first marked OVERDUE so that the
     * payment history reflects why the contract was terminated.
     *
     * @param today the current date, used to find past-due instalments
     */
    private void cancelOverdueContracts(LocalDate today) {
        List<Contract> overdueContracts = contractRepository.findActiveContractsWithPastDuePendingPayments(today);
        for (Contract contract : overdueContracts) {
            contractRepository.markPaymentsOverdueByContract(contract.getContractId());
            contractRepository.cancelContract(contract.getContractId());
            String title = "Contract Cancelled — Overdue Rent";
            String body = String.format("Contract #%d has been automatically cancelled because a monthly installment was not settled by its due date.", contract.getContractId());
            notificationService.createNotification(contract.getTenantId().intValue(), "REQUEST_CANCELLED", title, body);
        }
    }

    /**
     * Moves any ACTIVE contract to COMPLETED when its end date has passed.
     * The contract repository method only selects contracts where all instalments are
     * in a terminal state (PAID, WAIVED), so a contract with outstanding payments is
     * never prematurely completed.
     *
     * @param today the current date, used to find contracts whose lease term has expired
     */
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
