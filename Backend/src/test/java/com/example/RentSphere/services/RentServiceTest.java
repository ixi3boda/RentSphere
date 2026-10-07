package com.example.RentSphere.services;

import com.example.RentSphere.Dto.*;
import com.example.RentSphere.Repository.RentRepository;
import com.example.RentSphere.Service.ContractService;
import com.example.RentSphere.Service.NotificationService;
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
    @Mock private NotificationService notificationService;

    @InjectMocks private RentService rentService;

    

    @Test
    @DisplayName("createRentalRequest - null payload throws IllegalArgumentException")
    void createRentalRequest_nullPayload_throws() {
        assertThatThrownBy(() -> rentService.createRentalRequest(null, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("payload is required");
    }

    @Test
    @DisplayName("createRentalRequest - null propertyId throws")
    void createRentalRequest_nullPropertyId_throws() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setPropertyId(null);
        assertThatThrownBy(() -> rentService.createRentalRequest(req, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Property ID is required");
    }

    @Test
    @DisplayName("createRentalRequest - null desiredStart throws")
    void createRentalRequest_nullDesiredStart_throws() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setDesiredStart(null);
        assertThatThrownBy(() -> rentService.createRentalRequest(req, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("start date is required");
    }

    @Test
    @DisplayName("createRentalRequest - 0 months throws (invalid duration)")
    void createRentalRequest_zeroMonths_throws() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setDesiredMonths(0);
        assertThatThrownBy(() -> rentService.createRentalRequest(req, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("between 1 and 24");
    }

    @Test
    @DisplayName("createRentalRequest - 25 months throws (invalid duration)")
    void createRentalRequest_25Months_throws() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setDesiredMonths(25);
        assertThatThrownBy(() -> rentService.createRentalRequest(req, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("between 1 and 24");
    }

    @Test
    @DisplayName("createRentalRequest - valid request delegates to repository")
    void createRentalRequest_valid_delegatesToRepository() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        RentalRequest expected = TestFixtures.pendingRentalRequest();
        when(rentRepository.createRentalRequest(req, 2)).thenReturn(expected);
        when(propertyService.getById(1L)).thenReturn(availableProperty());

        RentalRequest result = rentService.createRentalRequest(req, 2);
        assertThat(result.getReqStatus()).isEqualTo("PENDING");
        verify(rentRepository).createRentalRequest(req, 2);
    }

    private static PropertyDetails availableProperty() {
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(TestFixtures.testProperty());
        return pd;
    }

    @Test
    @DisplayName("createRentalRequest - an owner cannot request their own listing")
    void createRentalRequest_ownProperty_throws() {
        when(propertyService.getById(1L)).thenReturn(availableProperty());

        assertThatThrownBy(() -> rentService.createRentalRequest(TestFixtures.validCreateRentalRequest(), 1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("your own property");
        verify(rentRepository, never()).createRentalRequest(any(), anyInt());
    }

    @Test
    @DisplayName("createRentalRequest - a leased listing cannot be requested")
    void createRentalRequest_unavailableProperty_throws() {
        PropertyDetails pd = availableProperty();
        pd.getProperty().setIsAvailable(false);
        when(propertyService.getById(1L)).thenReturn(pd);

        assertThatThrownBy(() -> rentService.createRentalRequest(TestFixtures.validCreateRentalRequest(), 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not available");
    }

    @Test
    @DisplayName("createRentalRequest - a second pending request for the same listing is refused")
    void createRentalRequest_duplicatePending_throws() {
        when(propertyService.getById(1L)).thenReturn(availableProperty());
        when(rentRepository.existsPendingByTenantAndProperty(2, 1L)).thenReturn(true);

        assertThatThrownBy(() -> rentService.createRentalRequest(TestFixtures.validCreateRentalRequest(), 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already have a pending request");
    }

    @Test
    @DisplayName("createRentalRequest - a start date years away is refused")
    void createRentalRequest_farFutureStart_throws() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setDesiredStart(java.time.LocalDate.now().plusYears(5));

        assertThatThrownBy(() -> rentService.createRentalRequest(req, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("within the next 12 months");
    }

    @Test
    @DisplayName("acceptRequest - a listing that is already leased cannot be let twice")
    void acceptRequest_alreadyLeased_throws() {
        when(rentRepository.findById(1L)).thenReturn(java.util.Optional.of(TestFixtures.pendingRentalRequest()));
        PropertyDetails pd = availableProperty();
        pd.getProperty().setIsAvailable(false);
        when(propertyService.getById(1L)).thenReturn(pd);

        assertThatThrownBy(() -> rentService.acceptRequest(1L, 1))
                .isInstanceOf(com.example.RentSphere.Exception.BadRequestException.class)
                .hasMessageContaining("already leased");
        verify(rentRepository, never()).updateStatus(anyLong(), anyString());
    }

    @Test
    @DisplayName("createRentalRequest - notifies the property owner")
    void createRentalRequest_notifiesOwner() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        when(rentRepository.createRentalRequest(req, 2)).thenReturn(TestFixtures.pendingRentalRequest());

        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(TestFixtures.testProperty());
        when(propertyService.getById(1L)).thenReturn(pd);

        rentService.createRentalRequest(req, 2);

        verify(notificationService).createNotification(eq(1), eq("NEW_REQUEST"), contains("request #1"), anyString());
    }

    @Test
    @DisplayName("createRentalRequest - exactly 1 month is valid")
    void createRentalRequest_1Month_valid() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setDesiredMonths(1);
        RentalRequest expected = TestFixtures.pendingRentalRequest();
        when(rentRepository.createRentalRequest(req, 2)).thenReturn(expected);
        when(propertyService.getById(1L)).thenReturn(availableProperty());

        assertThatNoException().isThrownBy(() -> rentService.createRentalRequest(req, 2));
    }

    @Test
    @DisplayName("createRentalRequest - exactly 24 months is valid")
    void createRentalRequest_24Months_valid() {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setDesiredMonths(24);
        RentalRequest expected = TestFixtures.pendingRentalRequest();
        when(rentRepository.createRentalRequest(req, 2)).thenReturn(expected);
        when(propertyService.getById(1L)).thenReturn(availableProperty());

        assertThatNoException().isThrownBy(() -> rentService.createRentalRequest(req, 2));
    }

    

    @Test
    @DisplayName("getById - throws RuntimeException when not found")
    void getById_throws_whenNotFound() {
        when(rentRepository.findById(999L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> rentService.getById(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("getById - returns request when found")
    void getById_returnsRequest_whenFound() {
        RentalRequest req = TestFixtures.pendingRentalRequest();
        when(rentRepository.findById(1L)).thenReturn(Optional.of(req));

        RentalRequest result = rentService.getById(1L);
        assertThat(result.getRentalReqId()).isEqualTo(1);
    }

    

    @Test
    @DisplayName("acceptRequest - throws when request not PENDING")
    void acceptRequest_throws_whenNotPending() {
        RentalRequest req = TestFixtures.pendingRentalRequest();
        req.setReqStatus("ACCEPTED");
        when(rentRepository.findById(1L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> rentService.acceptRequest(1L, 1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("pending");
    }

    @Test
    @DisplayName("acceptRequest - throws when caller is not the property owner")
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
    @DisplayName("acceptRequest - creates contract for valid accept")
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
        verify(notificationService).createNotification(eq(2), eq("REQUEST_ACCEPTED"), anyString(), anyString());
    }

    

    @Test
    @DisplayName("rejectRequest - throws when request not PENDING")
    void rejectRequest_throws_whenNotPending() {
        RentalRequest req = TestFixtures.pendingRentalRequest();
        req.setReqStatus("REJECTED");
        when(rentRepository.findById(1L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> rentService.rejectRequest(1L, 1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("pending");
    }

    @Test
    @DisplayName("rejectRequest - throws when caller is not the property owner")
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
    @DisplayName("rejectRequest - throws RuntimeException when updateStatus returns 0")
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
    @DisplayName("getRentalRequests - passes the page window through to the repository")
    void getRentalRequests_returnsPage() {
        when(rentRepository.findAllForOwner(1, "PENDING", 20, 40)).thenReturn(List.of(TestFixtures.pendingRentalRequest()));

        List<RentalRequest> result = rentService.getRentalRequests(1, "PENDING", 20, 40);

        assertThat(result).hasSize(1);
        verify(rentRepository).findAllForOwner(1, "PENDING", 20, 40);
    }

    @Test
    @DisplayName("requestStatusCounts - returns the repository grouping")
    void requestStatusCounts_returnsGrouping() {
        when(rentRepository.countRequestsByStatusForOwner(1)).thenReturn(java.util.Map.of("PENDING", 3));

        assertThat(rentService.requestStatusCounts(1)).containsEntry("PENDING", 3);
    }
}
