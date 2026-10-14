package com.example.RentSphere.repositories;

import com.example.RentSphere.Dto.Contract;
import com.example.RentSphere.Dto.PaymentDto;
import com.example.RentSphere.Repository.ContractRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("ContractRepository Integration Tests")
class ContractRepositoryTest {

    @Autowired
    private ContractRepository contractRepository;

    @Test
    @DisplayName("findAll returns one page of contracts")
    void findAll_returnsContractsPage() {
        List<Contract> list = contractRepository.findAllForOwner(1L, null, 12, 0);
        assertThat(list).isNotNull();
        assertThat(list).hasSizeLessThanOrEqualTo(12);
    }

    @Test
    @DisplayName("findAll filters by status, case-insensitively")
    void findAll_filtersByStatus() {
        List<Contract> page = contractRepository.findAllForOwner(1L, "active", 10, 0);
        assertThat(page).allSatisfy(c -> assertThat(c.getContractStatus()).isEqualTo("ACTIVE"));
        assertThat(contractRepository.countContractsForOwner(1L, "ACTIVE")).isGreaterThanOrEqualTo(page.size());
    }

    @Test
    @DisplayName("countContractsByStatus covers every contract exactly once")
    void countContractsByStatus_totalsEveryRow() {
        Map<String, Integer> counts = contractRepository.countContractsByStatusForOwner(1L);
        int grouped = counts.values().stream().mapToInt(Integer::intValue).sum();
        assertThat(grouped).isEqualTo(contractRepository.countContractsForOwner(1L, null));
    }

    @Test
    @DisplayName("createContract persists new contract")
    void createContract_persistsContract() {
        Contract contract = Contract.builder()
                .rentalRequestId(1L)
                .propertyId(1L)
                .ownerId(1L)
                .tenantId(2L)
                .contractStatus("ACTIVE")
                .rentAmount(new java.math.BigDecimal("1500.0"))
                .durationMonths(12)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(12))
                .notes("Integration test contract")
                .build();
                
        Contract saved = contractRepository.createContract(contract);
        
        assertThat(saved.getContractId()).isGreaterThan(0);
        
        Optional<Contract> retrieved = contractRepository.findById((long) saved.getContractId());
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getNotes()).isEqualTo("Integration test contract");
    }

    @Test
    @DisplayName("updateStatus changes contract status")
    void cancelContract_modifiesStatus() {
        Contract contract = Contract.builder()
                .rentalRequestId(1L).propertyId(1L).ownerId(1L).tenantId(2L)
                .contractStatus("PENDING").rentAmount(new java.math.BigDecimal("1500.0")).durationMonths(1)
                .startDate(LocalDate.now()).endDate(LocalDate.now().plusMonths(1))
                .build();
        Contract saved = contractRepository.createContract(contract);
        long id = saved.getContractId();
        
        int rows = contractRepository.cancelContract(id);
        assertThat(rows).isEqualTo(1);
        
        Contract updated = contractRepository.findById(id).get();
        assertThat(updated.getContractStatus()).isEqualTo("CANCELLED");
    }

    @Test
    @DisplayName("createPaymentSchedule populates payments table")
    void createPaymentSchedule_insertsPayments() {
        Contract contract = Contract.builder()
                .rentalRequestId(1L).propertyId(1L).ownerId(1L).tenantId(2L)
                .contractStatus("ACTIVE").rentAmount(new java.math.BigDecimal("1500.0")).durationMonths(3)
                .startDate(LocalDate.now()).endDate(LocalDate.now().plusMonths(3))
                .build();
        Contract saved = contractRepository.createContract(contract);
        long id = saved.getContractId();
        
        contractRepository.createPaymentSchedule(id, new java.math.BigDecimal("1500.0"), 3, LocalDate.now());
        
        int pendingCount = contractRepository.countPendingPayments(id);
        assertThat(pendingCount).isEqualTo(3);
    }
}
