package com.example.RentSphere.integration;

import com.example.RentSphere.Dto.CreatePropertyRequest;
import java.math.BigDecimal;
import com.example.RentSphere.Dto.CreateRentalRequest;
import com.example.RentSphere.Dto.RentalRequest;
import com.example.RentSphere.Dto.Contract;
import com.example.RentSphere.Service.ContractService;
import com.example.RentSphere.Service.PropertyService;
import com.example.RentSphere.Service.RentService;
import com.example.RentSphere.Service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;


@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DisplayName("Core Workflow Integration Tests (Tenant & Admin Journey)")
class CoreWorkflowIntegrationTest {

    @Autowired private UserService userService;
    @Autowired private PropertyService propertyService;
    @Autowired private RentService rentService;
    @Autowired private ContractService contractService;

    @Test
    @DisplayName("Full Rental Journey: Admin creates property -> Tenant requests -> Admin accepts -> Contract created")
    void fullRentalJourney() {
        
        int adminUserId = 1; 
        CreatePropertyRequest newPropReq = CreatePropertyRequest.builder()
                .title("Workflow Test Villa")
                .propertyType("VILLA")
                .propertyDescription("Luxurious workflow test villa")
                .pricePerMonth(new java.math.BigDecimal("8000.0"))
                .city("Jeddah")
                .district("Al Shati")
                .address("Corniche Road 123")
                .numRooms(5)
                .areaSqm(new java.math.BigDecimal("450.0"))
                .isAvailable(true)
                .build();
        
        var propertyDetails = propertyService.addProperty(newPropReq, adminUserId);
        long newPropertyId = propertyDetails.getProperty().getPropertyId();
        assertThat(newPropertyId).isGreaterThan(0);

        
        int tenantUserId = 2; 
        propertyService.favorite((int) newPropertyId, tenantUserId);
        
        
        CreateRentalRequest rentReq = CreateRentalRequest.builder()
                .propertyId(newPropertyId)
                .message("I want to rent this workflow villa")
                .desiredStart(java.time.LocalDate.parse("2025-01-01"))
                .desiredMonths(12)
                .build();
                
        RentalRequest rentalRequest = rentService.createRentalRequest(rentReq, tenantUserId);
        long requestId = rentalRequest.getRentalReqId();
        assertThat(rentalRequest.getReqStatus()).isEqualTo("PENDING");

        
        Contract contract = rentService.acceptRequest(requestId, adminUserId);
        
        
        assertThat(contract).isNotNull();
        assertThat(contract.getContractStatus()).isEqualTo("ACTIVE");
        assertThat(contract.getRentAmount()).isEqualByComparingTo(new BigDecimal("8000.0"));
        assertThat(contract.getDurationMonths()).isEqualTo(12);
        
        
        var tenantUser = userService.getCurrentUser("tenant@test.com");
        assertThat(tenantUser.getRole_name()).isEqualTo("TENANT");
    }

    @Test
    @DisplayName("Admin rejects request: Tenant requests -> Admin rejects")
    void rejectionWorkflow() {
        int adminUserId = 1; 
        int tenantUserId = 2; 
        
        
        int propertyId = 1; 

        CreateRentalRequest rentReq = CreateRentalRequest.builder()
                .propertyId((long) propertyId)
                .message("Lowball offer")
                .desiredStart(java.time.LocalDate.parse("2024-10-01"))
                .desiredMonths(6)
                .build();
                
        RentalRequest rentalRequest = rentService.createRentalRequest(rentReq, tenantUserId);
        long requestId = rentalRequest.getRentalReqId();
        
        
        RentalRequest rejected = rentService.rejectRequest(requestId, adminUserId);
        
        assertThat(rejected.getReqStatus()).isEqualTo("REJECTED");
    }
}
