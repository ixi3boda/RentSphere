package com.example.RentSphere.controllers;

import com.example.RentSphere.Dto.*;
import com.example.RentSphere.Service.ContractService;
import com.example.RentSphere.Service.RentService;
import com.example.RentSphere.Service.UserService;
import com.example.RentSphere.SecurityConfig.JwtService;
import com.example.RentSphere.fixtures.TestFixtures;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@org.springframework.context.annotation.Import({com.example.RentSphere.SecurityConfig.SecConfig.class, com.example.RentSphere.SecurityConfig.JwtAuthenticationFilter.class})
@WebMvcTest(com.example.RentSphere.Controller.RentController.class)
@DisplayName("RentController MockMvc Tests")
class RentControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private RentService rentService;
    @MockBean private ContractService contractService;
    @MockBean private UserService userService;
    @MockBean private JwtService jwtService;
    @MockBean private org.springframework.security.core.userdetails.UserDetailsService myUserDetailsService;

    

    @Test
    @DisplayName("POST /request - 201 for authenticated user")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void rentRequest_authenticated_returns201() throws Exception {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(TestFixtures.tenantUser());
        when(rentService.createRentalRequest(any(), eq(2))).thenReturn(TestFixtures.pendingRentalRequest());

        mockMvc.perform(post("/api/rent/request")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reqStatus").value("PENDING"));
    }

    @Test
    @DisplayName("POST /request - 401 for unauthenticated")
    void rentRequest_unauthenticated_returns401() throws Exception {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        mockMvc.perform(post("/api/rent/request")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /request - 400 for invalid payload (null propertyId)")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void rentRequest_invalidPayload_returns400() throws Exception {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setPropertyId(null);

        mockMvc.perform(post("/api/rent/request")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.propertyId").exists());
    }

    @Test
    @DisplayName("POST /request - 400 when desiredStart is in the past")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void rentRequest_pastStartDate_returns400() throws Exception {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setDesiredStart(java.time.LocalDate.now().minusDays(1));

        mockMvc.perform(post("/api/rent/request")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.desiredStart").exists());
    }

    

    @Test
    @DisplayName("GET /requests/all - 200 for ADMIN, paged envelope")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void getAllRequests_asAdmin_returns200() throws Exception {
        when(rentService.getRentalRequests(null, 20, 0)).thenReturn(List.of(TestFixtures.pendingRentalRequest()));
        when(rentService.countRentalRequests(null)).thenReturn(30001);

        mockMvc.perform(get("/api/rent/requests/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(30001))
                .andExpect(jsonPath("$.items[0].reqStatus").value("PENDING"));
    }

    @Test
    @DisplayName("GET /requests/all - size is clamped and page drives the offset")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void getAllRequests_clampsPage() throws Exception {
        when(rentService.getRentalRequests(any(), anyInt(), anyInt())).thenReturn(List.of());
        when(rentService.countRentalRequests(any())).thenReturn(0);

        mockMvc.perform(get("/api/rent/requests/all").param("page", "3").param("size", "5000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(100));

        verify(rentService).getRentalRequests(null, 100, 300);
    }

    @Test
    @DisplayName("GET /requests/summary - every status key present, unknown ones zero")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void requestSummary_returnsEveryStatus() throws Exception {
        when(rentService.requestStatusCounts())
                .thenReturn(java.util.Map.of("PENDING", 7500, "ACCEPTED", 7501));

        mockMvc.perform(get("/api/rent/requests/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.PENDING").value(7500))
                .andExpect(jsonPath("$.ACCEPTED").value(7501))
                .andExpect(jsonPath("$.REJECTED").value(0))
                .andExpect(jsonPath("$.CANCELLED").value(0))
                .andExpect(jsonPath("$.total").value(15001));
    }

    @Test
    @DisplayName("GET /requests/all - 403 for TENANT (ADMIN only)")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void getAllRequests_asTenant_returns403() throws Exception {
        mockMvc.perform(get("/api/rent/requests/all"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /requests/all - 401 for unauthenticated")
    void getAllRequests_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/rent/requests/all"))
                .andExpect(status().isForbidden());
    }

    

    @Test
    @DisplayName("GET /requests/{id} - 200 when found")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void getRequestById_found_returns200() throws Exception {
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(TestFixtures.tenantUser());
        when(rentService.getByIdForActor(1L, 2, false)).thenReturn(TestFixtures.pendingRentalRequest());

        mockMvc.perform(get("/api/rent/requests/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rentalReqId").value(1));
    }

    @Test
    @DisplayName("GET /requests/{id} - 404 when not found")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void getRequestById_notFound_returns404() throws Exception {
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(TestFixtures.tenantUser());
        when(rentService.getByIdForActor(999L, 2, false)).thenThrow(new com.example.RentSphere.Exception.ResourceNotFoundException("Rental request not found"));

        mockMvc.perform(get("/api/rent/requests/999"))
                .andExpect(status().isNotFound());
    }

    

    @Test
    @DisplayName("PUT /requests/{id}/accept - 200 for authenticated owner")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void acceptRequest_asOwner_returns200() throws Exception {
        when(userService.getCurrentUser("admin@test.com")).thenReturn(TestFixtures.adminUser());
        when(rentService.acceptRequest(1L, 1)).thenReturn(TestFixtures.activeContract());

        mockMvc.perform(put("/api/rent/requests/1/accept").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contractStatus").value("ACTIVE"));
    }

    

    @Test
    @DisplayName("PUT /requests/{id}/reject - 200 for authenticated owner")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void rejectRequest_asOwner_returns200() throws Exception {
        RentalRequest rejected = TestFixtures.pendingRentalRequest();
        rejected.setReqStatus("REJECTED");
        when(userService.getCurrentUser("admin@test.com")).thenReturn(TestFixtures.adminUser());
        when(rentService.rejectRequest(1L, 1)).thenReturn(rejected);

        mockMvc.perform(put("/api/rent/requests/1/reject").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reqStatus").value("REJECTED"));
    }

    @Test
    @DisplayName("GET /contracts/all - 200 for ADMIN role returning owner contracts")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void getAllContracts_asAdmin_returns200() throws Exception {
        User admin = TestFixtures.adminUser();
        admin.setRole_name("ADMIN");
        when(userService.getCurrentUser("admin@test.com")).thenReturn(admin);
        when(contractService.getContractsForOwner((long) admin.getUser_id()))
                .thenReturn(List.of(TestFixtures.activeContract()));

        mockMvc.perform(get("/api/rent/contracts/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].contractStatus").value("ACTIVE"));
    }

    @Test
    @DisplayName("GET /contracts/manage - returns the paged envelope")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void manageContracts_returnsEnvelope() throws Exception {
        when(contractService.getContracts("ACTIVE", 12, 12))
                .thenReturn(List.of(TestFixtures.activeContract()));
        when(contractService.countContracts("ACTIVE")).thenReturn(7501);

        mockMvc.perform(get("/api/rent/contracts/manage")
                        .param("status", "ACTIVE")
                        .param("page", "1")
                        .param("size", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(7501))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.items[0].contractStatus").value("ACTIVE"));
    }

    @Test
    @DisplayName("GET /contracts/manage - size is clamped to the server maximum")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void manageContracts_clampsSize() throws Exception {
        when(contractService.getContracts(null, 100, 300)).thenReturn(List.of());
        when(contractService.countContracts(null)).thenReturn(0);

        mockMvc.perform(get("/api/rent/contracts/manage").param("page", "3").param("size", "5000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(100));

        verify(contractService).getContracts(null, 100, 300);
    }

    @Test
    @DisplayName("GET /contracts/manage - rejected for a tenant")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void manageContracts_asTenant_returns403() throws Exception {
        mockMvc.perform(get("/api/rent/contracts/manage"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /contracts/manage/summary - statuses missing from the grouping report zero")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void contractSummary_zeroFillsMissingStatuses() throws Exception {
        java.util.Map<String, Integer> byStatus = new java.util.HashMap<>();
        byStatus.put("ACTIVE", 3751);
        byStatus.put("COMPLETED", 3750);
        when(contractService.contractStatusCounts()).thenReturn(byStatus);

        mockMvc.perform(get("/api/rent/contracts/manage/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ACTIVE").value(3751))
                .andExpect(jsonPath("$.COMPLETED").value(3750))
                .andExpect(jsonPath("$.PENDING").value(0))
                .andExpect(jsonPath("$.CANCELLED").value(0))
                .andExpect(jsonPath("$.total").value(7501));
    }

    @Test
    @DisplayName("GET /contracts/all - 200 for TENANT role returning tenant contracts")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void getAllContracts_asTenant_returns200() throws Exception {
        User tenant = TestFixtures.tenantUser();
        tenant.setRole_name("TENANT");
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(tenant);
        when(contractService.getContractsForTenant(2L)).thenReturn(List.of(TestFixtures.activeContract()));

        mockMvc.perform(get("/api/rent/contracts/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /contracts/{contractId}/payments - 200 returning payments list")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void getContractPayments_returns200() throws Exception {
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(TestFixtures.tenantUser());
        when(contractService.getPaymentsByContractId(1L, 2L, false)).thenReturn(List.of());

        mockMvc.perform(get("/api/rent/contracts/1/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("POST /contracts/{contractId}/paypal - 200 for valid payment creation")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void createContractPayPalPayment_returns200() throws Exception {
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(TestFixtures.tenantUser());
        PayPalPaymentResponse resp = new PayPalPaymentResponse();
        resp.setApprovalUrl("https://paypal.com/approve");
        when(contractService.createPayPalPaymentForContract(eq(1L), any(), eq(2L), eq(false))).thenReturn(resp);

        PayPalPaymentRequest req = new PayPalPaymentRequest();
        req.setCancelUrl("http://cancel");
        req.setSuccessUrl("http://success");

        mockMvc.perform(post("/api/rent/contracts/1/paypal")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalUrl").value("https://paypal.com/approve"));
    }

    @Test
    @DisplayName("POST /contracts/{contractId}/paypal/execute - 200 for valid payment execution")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void executeContractPayPalPayment_returns200() throws Exception {
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(TestFixtures.tenantUser());
        PayPalPaymentResponse resp = new PayPalPaymentResponse();
        resp.setStatus("APPROVED");
        when(contractService.executePayPalPaymentForContract(eq(1L), eq("pay123"), eq("payer123"), isNull(), eq(2L), eq(false))).thenReturn(resp);

        mockMvc.perform(post("/api/rent/contracts/1/paypal/execute")
                        .with(csrf())
                        .param("paymentId", "pay123")
                        .param("payerId", "payer123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }
}
