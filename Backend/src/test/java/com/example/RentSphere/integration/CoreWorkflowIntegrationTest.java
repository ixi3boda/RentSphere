package com.example.RentSphere.integration;

import com.example.RentSphere.Dto.CreatePropertyRequest;
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

/**
 * End-to-end service integration test for the core Tenant/Admin journey.
 * Uses real DB (H2 test profile), real Services, real Repositories.
 */
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
        // 1. Admin creates a new property
        int adminUserId = 1; // From data-test.sql
        CreatePropertyRequest newPropReq = CreatePropertyRequest.builder()
                .title("Workflow Test Villa")
                .propertyType("VILLA")
                .pricePerMonth(8000.0)
                .city("Jeddah")
                .district("Al Shati")
                .isAvailable(true)
                .build();
        
        var propertyDetails = propertyService.addProperty(newPropReq, adminUserId);
        long newPropertyId = propertyDetails.getProperty().getPropertyId();
        assertThat(newPropertyId).isGreaterThan(0);

        // 2. Tenant browses and favorites the property
        int tenantUserId = 2; // From data-test.sql
        propertyService.favorite((int) newPropertyId, tenantUserId);
        
        // 3. Tenant submits a rental request
        CreateRentalRequest rentReq = CreateRentalRequest.builder()
                .propertyId((int) newPropertyId)
                .message("I want to rent this workflow villa")
                .desiredStart("2025-01-01")
                .desiredMonths(12)
                .build();
                
        RentalRequest rentalRequest = rentService.createRentalRequest(rentReq, tenantUserId);
        long requestId = rentalRequest.getRentalReqId();
        assertThat(rentalRequest.getReqStatus()).isEqualTo("PENDING");

        // 4. Admin reviews and accepts the request
        Contract contract = rentService.acceptRequest(requestId, adminUserId);
        
        // 5. Verify the contract is created properly
        assertThat(contract).isNotNull();
        assertThat(contract.getContractStatus()).isEqualTo("ACTIVE");
        assertThat(contract.getRentAmount()).isEqualTo(8000.0);
        assertThat(contract.getDurationMonths()).isEqualTo(12);
        
        // 6. Verify Tenant's role (RentService/ContractService updates it to TENANT)
        var tenantUser = userService.getCurrentUser("tenant@test.com");
        assertThat(tenantUser.getRole_name()).isEqualTo("TENANT");
    }

    @Test
    @DisplayName("Admin rejects request: Tenant requests -> Admin rejects")
    void rejectionWorkflow() {
        int adminUserId = 1; 
        int tenantUserId = 2; 
        
        // Use property 1 seeded from data-test.sql
        int propertyId = 1; 

        CreateRentalRequest rentReq = CreateRentalRequest.builder()
                .propertyId(propertyId)
                .message("Lowball offer")
                .desiredStart("2024-10-01")
                .desiredMonths(6)
                .build();
                
        RentalRequest rentalRequest = rentService.createRentalRequest(rentReq, tenantUserId);
        long requestId = rentalRequest.getRentalReqId();
        
        // Admin rejects
        RentalRequest rejected = rentService.rejectRequest(requestId, adminUserId);
        
        assertThat(rejected.getReqStatus()).isEqualTo("REJECTED");
    }
}
