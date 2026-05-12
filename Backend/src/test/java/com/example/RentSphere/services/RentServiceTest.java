package com.example.RentSphere.services;

import com.example.RentSphere.Dto.*;
import com.example.RentSphere.Repository.RentRepository;
import com.example.RentSphere.Service.ContractService;
import com.example.RentSphere.Service.PropertyService;
import com.example.RentSphere.Service.RentService;
import com.example.RentSphere.fixtures.TestFixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
@DisplayName("RentService Unit Tests")
class RentServiceTest {

    @Mock private RentRepository rentRepository;
    @Mock private PropertyService propertyService;
    @Mock private ContractService contractService;

    @InjectMocks private RentService rentService;

    

    @Test
    @DisplayName("createRentalRequest — null payload throws IllegalArgumentException")
    void createRentalRequest_nullPayload_throws() {
        assertThatThrownBy(() -> rentService.createRentalRequest(null, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("payload is required");
    }

    @Test
    @DisplayName("createRentalRequest — null propertyId throws")
    void createRentalRequest_nullPropertyId_throws() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setPropertyId(null);
        assertThatThrownBy(() -> rentService.createRentalRequest(req, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Property ID is required");
    }

    @Test
    @DisplayName("createRentalRequest — null desiredStart throws")
    void createRentalRequest_nullDesiredStart_throws() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setDesiredStart(null);
        assertThatThrownBy(() -> rentService.createRentalRequest(req, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("start date is required");
    }

    @Test
    @DisplayName("createRentalRequest — 0 months throws (invalid duration)")
    void createRentalRequest_zeroMonths_throws() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setDesiredMonths(0);
        assertThatThrownBy(() -> rentService.createRentalRequest(req, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("between 1 and 24");
    }

    @Test
    @DisplayName("createRentalRequest — 25 months throws (invalid duration)")
    void createRentalRequest_25Months_throws() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setDesiredMonths(25);
        assertThatThrownBy(() -> rentService.createRentalRequest(req, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("between 1 and 24");
    }

    @Test
    @DisplayName("createRentalRequest — valid request delegates to repository")
    void createRentalRequest_valid_delegatesToRepository() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        RentalRequest expected = TestFixtures.pendingRentalRequest();
        when(rentRepository.createRentalRequest(req, 2)).thenReturn(expected);

        RentalRequest result = rentService.createRentalRequest(req, 2);
        assertThat(result.getReqStatus()).isEqualTo("PENDING");
        verify(rentRepository).createRentalRequest(req, 2);
    }

    @Test
    @DisplayName("createRentalRequest — exactly 1 month is valid")
    void createRentalRequest_1Month_valid() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setDesiredMonths(1);
        RentalRequest expected = TestFixtures.pendingRentalRequest();
        when(rentRepository.createRentalRequest(req, 2)).thenReturn(expected);

        assertThatNoException().isThrownBy(() -> rentService.createRentalRequest(req, 2));
    }

    @Test
    @DisplayName("createRentalRequest — exactly 24 months is valid")
    void createRentalRequest_24Months_valid() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setDesiredMonths(24);
        RentalRequest expected = TestFixtures.pendingRentalRequest();
        when(rentRepository.createRentalRequest(req, 2)).thenReturn(expected);

        assertThatNoException().isThrownBy(() -> rentService.createRentalRequest(req, 2));
    }

    

    @Test
    @DisplayName("getById — throws RuntimeException when not found")
    void getById_throws_whenNotFound() {
        when(rentRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> rentService.getById(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("getById — returns request when found")
    void getById_returnsRequest_whenFound() {
        RentalRequest req = TestFixtures.pendingRentalRequest();
        when(rentRepository.findById(1L)).thenReturn(Optional.of(req));

        RentalRequest result = rentService.getById(1L);
        assertThat(result.getRentalReqId()).isEqualTo(1);
    }

    

    @Test
    @DisplayName("acceptRequest — throws when request not PENDING")
    void acceptRequest_throws_whenNotPending() {
        RentalRequest req = TestFixtures.pendingRentalRequest();
        req.setReqStatus("ACCEPTED");
        when(rentRepository.findById(1L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> rentService.acceptRequest(1L, 1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("pending");
    }

    @Test
    @DisplayName("acceptRequest — throws when caller is not the property owner")
    void acceptRequest_throws_whenNotOwner() {
        RentalRequest req = TestFixtures.pendingRentalRequest(); 
        when(rentRepository.findById(1L)).thenReturn(Optional.of(req));

        Property prop = TestFixtures.testProperty(); 
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(prop);
        when(propertyService.getById(1L)).thenReturn(pd);

        
        assertThatThrownBy(() -> rentService.acceptRequest(1L, 99))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("property owner");
    }

    @Test
    @DisplayName("acceptRequest — creates contract for valid accept")
    void acceptRequest_createsContract() {
        RentalRequest req = TestFixtures.pendingRentalRequest(); 
        when(rentRepository.findById(1L)).thenReturn(Optional.of(req));

        Property prop = TestFixtures.testProperty(); 
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(prop);
        when(propertyService.getById(1L)).thenReturn(pd);
        when(rentRepository.updateStatus(1L, "ACCEPTED")).thenReturn(1);

        Contract contract = TestFixtures.activeContract();
        when(contractService.createContractForApprovedRequest(req, pd)).thenReturn(contract);

        Contract result = rentService.acceptRequest(1L, 1); 
        assertThat(result.getContractStatus()).isEqualTo("ACTIVE");
        verify(contractService).createContractForApprovedRequest(req, pd);
    }

    

    @Test
    @DisplayName("rejectRequest — throws when request not PENDING")
    void rejectRequest_throws_whenNotPending() {
        RentalRequest req = TestFixtures.pendingRentalRequest();
        req.setReqStatus("REJECTED");
        when(rentRepository.findById(1L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> rentService.rejectRequest(1L, 1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("pending");
    }

    @Test
    @DisplayName("rejectRequest — throws when caller is not the property owner")
    void rejectRequest_throws_whenNotOwner() {
        RentalRequest req = TestFixtures.pendingRentalRequest();
        when(rentRepository.findById(1L)).thenReturn(Optional.of(req));

        Property prop = TestFixtures.testProperty(); 
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(prop);
        when(propertyService.getById(1L)).thenReturn(pd);

        assertThatThrownBy(() -> rentService.rejectRequest(1L, 55))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("property owner");
    }

    @Test
    @DisplayName("rejectRequest — throws RuntimeException when updateStatus returns 0")
    void rejectRequest_throws_whenUpdateFails() {
        RentalRequest req = TestFixtures.pendingRentalRequest();
        when(rentRepository.findById(1L)).thenReturn(Optional.of(req));

        Property prop = TestFixtures.testProperty(); 
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(prop);
        when(propertyService.getById(1L)).thenReturn(pd);
        when(rentRepository.updateStatus(1L, "REJECTED")).thenReturn(0);

        assertThatThrownBy(() -> rentService.rejectRequest(1L, 1))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unable to reject");
    }

    

    @Test
    @DisplayName("getAllRentalRequests — returns list from repository")
    void getAllRentalRequests_returnsList() {
        when(rentRepository.findAll()).thenReturn(List.of(TestFixtures.pendingRentalRequest()));
        List<RentalRequest> result = rentService.getAllRentalRequests();
        assertThat(result).hasSize(1);
    }
}
