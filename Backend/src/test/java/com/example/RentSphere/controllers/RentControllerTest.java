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

@WebMvcTest(com.example.RentSphere.Controller.RentController.class)
@DisplayName("RentController MockMvc Tests")
class RentControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private RentService rentService;
    @MockBean private ContractService contractService;
    @MockBean private UserService userService;
    @MockBean private JwtService jwtService;
    @MockBean private com.example.RentSphere.Service.MyUserDetailsService myUserDetailsService;

    // ── POST /api/rent/request ─────────────────────────────────────

    @Test
    @DisplayName("POST /request — 201 for authenticated user")
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
    @DisplayName("POST /request — 401 for unauthenticated")
    void rentRequest_unauthenticated_returns401() throws Exception {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        mockMvc.perform(post("/api/rent/request")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /request — 400 for invalid payload (null propertyId)")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void rentRequest_invalidPayload_returns400() throws Exception {
        CreateRentalRequest req = TestFixtures.validCreateRentalRequest();
        req.setPropertyId(null);
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(TestFixtures.tenantUser());
        when(rentService.createRentalRequest(any(), anyInt()))
                .thenThrow(new IllegalArgumentException("Property ID is required"));

        mockMvc.perform(post("/api/rent/request")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Property ID is required"));
    }

    // ── GET /api/rent/requests/all ─────────────────────────────────

    @Test
    @DisplayName("GET /requests/all — 200 for ADMIN")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void getAllRequests_asAdmin_returns200() throws Exception {
        when(rentService.getAllRentalRequests()).thenReturn(List.of(TestFixtures.pendingRentalRequest()));

        mockMvc.perform(get("/api/rent/requests/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].reqStatus").value("PENDING"));
    }

    @Test
    @DisplayName("GET /requests/all — 403 for TENANT (ADMIN only)")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void getAllRequests_asTenant_returns403() throws Exception {
        mockMvc.perform(get("/api/rent/requests/all"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /requests/all — 401 for unauthenticated")
    void getAllRequests_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/rent/requests/all"))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /api/rent/requests/{id} ────────────────────────────────

    @Test
    @DisplayName("GET /requests/{id} — 200 when found")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void getRequestById_found_returns200() throws Exception {
        when(rentService.getById(1L)).thenReturn(TestFixtures.pendingRentalRequest());

        mockMvc.perform(get("/api/rent/requests/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rentalReqId").value(1));
    }

    @Test
    @DisplayName("GET /requests/{id} — 404 when not found")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void getRequestById_notFound_returns404() throws Exception {
        when(rentService.getById(999L)).thenThrow(new RuntimeException("Rental request not found"));

        mockMvc.perform(get("/api/rent/requests/999"))
                .andExpect(status().isNotFound());
    }

    // ── GET /api/rent/contracts/all ────────────────────────────────

    @Test
    @DisplayName("GET /contracts/all — 200 for ADMIN")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void getAllContracts_asAdmin_returns200() throws Exception {
        when(contractService.getAllContracts()).thenReturn(List.of(TestFixtures.activeContract()));

        mockMvc.perform(get("/api/rent/contracts/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].contractStatus").value("ACTIVE"));
    }

    @Test
    @DisplayName("GET /contracts/all — 403 for TENANT")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void getAllContracts_asTenant_returns403() throws Exception {
        mockMvc.perform(get("/api/rent/contracts/all"))
                .andExpect(status().isForbidden());
    }

    // ── PUT /api/rent/requests/{id}/accept ────────────────────────

    @Test
    @DisplayName("PUT /requests/{id}/accept — 200 for authenticated owner")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void acceptRequest_asOwner_returns200() throws Exception {
        when(userService.getCurrentUser("admin@test.com")).thenReturn(TestFixtures.adminUser());
        when(rentService.acceptRequest(1L, 1)).thenReturn(TestFixtures.activeContract());

        mockMvc.perform(put("/api/rent/requests/1/accept").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contractStatus").value("ACTIVE"));
    }

    // ── PUT /api/rent/requests/{id}/reject ────────────────────────

    @Test
    @DisplayName("PUT /requests/{id}/reject — 200 for authenticated owner")
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
}
