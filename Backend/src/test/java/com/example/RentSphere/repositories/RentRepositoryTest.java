package com.example.RentSphere.repositories;

import com.example.RentSphere.Dto.CreateRentalRequest;
import com.example.RentSphere.Dto.RentalRequest;
import com.example.RentSphere.Repository.RentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("RentRepository Integration Tests")
class RentRepositoryTest {

    @Autowired
    private RentRepository rentRepository;

    @Test
    @DisplayName("findAll returns rental requests")
    void findAll_returnsRequests() {
        List<RentalRequest> list = rentRepository.findAll();
        assertThat(list).isNotEmpty();
        
        assertThat(list.size()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("findById returns request when exists")
    void findById_returnsRequest() {
        Optional<RentalRequest> opt = rentRepository.findById(1L);
        assertThat(opt).isPresent();
        assertThat(opt.get().getMessage()).isEqualTo("I want to rent this");
    }

    @Test
    @DisplayName("findById returns empty when not exists")
    void findById_returnsEmpty() {
        Optional<RentalRequest> opt = rentRepository.findById(999L);
        assertThat(opt).isEmpty();
    }

    @Test
    @DisplayName("createRentalRequest persists new request")
    void createRentalRequest_persistsRequest() {
        CreateRentalRequest req = CreateRentalRequest.builder()
                .propertyId(2L)
                .message("Test message")
                .desiredStart(LocalDate.parse("2024-10-01"))
                .desiredMonths(6)
                .build();
                
        
        RentalRequest saved = rentRepository.createRentalRequest(req, 2);
        
        assertThat(saved.getRentalReqId()).isGreaterThan(0);
        assertThat(saved.getReqStatus()).isEqualTo("PENDING");
        
        Optional<RentalRequest> retrieved = rentRepository.findById((long) saved.getRentalReqId());
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getMessage()).isEqualTo("Test message");
    }

    @Test
    @DisplayName("updateStatus changes request status")
    void updateStatus_modifiesStatus() {
        int rows = rentRepository.updateStatus(1L, "ACCEPTED");
        assertThat(rows).isEqualTo(1);

        RentalRequest updated = rentRepository.findById(1L).get();
        assertThat(updated.getReqStatus()).isEqualTo("ACCEPTED");
    }
}
