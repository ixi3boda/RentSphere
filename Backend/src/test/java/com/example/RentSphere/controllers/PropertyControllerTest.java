package com.example.RentSphere.controllers;

import com.example.RentSphere.Dto.*;
import com.example.RentSphere.Service.PropertyService;
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

/**
 * MockMvc controller tests for PropertyController.
 */
@WebMvcTest(com.example.RentSphere.Controller.PropertyController.class)
@DisplayName("PropertyController MockMvc Tests")
class PropertyControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private PropertyService propertyService;
    @MockBean private UserService userService;
    @MockBean private JwtService jwtService;
    @MockBean private com.example.RentSphere.Service.MyUserDetailsService myUserDetailsService;

    private PropertyDetails buildPropertyDetails() {
        PropertyDetails pd = new PropertyDetails();
        pd.setProperty(TestFixtures.testProperty());
        pd.setPropertyImages(List.of());
        return pd;
    }

    // ── GET /api/properties/all ────────────────────────────────────

    @Test
    @DisplayName("GET /all — 200 public endpoint returns list")
    void getAll_public_returns200() throws Exception {
        when(propertyService.getAll()).thenReturn(List.of(buildPropertyDetails()));

        mockMvc.perform(get("/api/properties/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].property.title").value("Test Apartment"));
    }

    @Test
    @DisplayName("GET /all — 500 when service throws")
    void getAll_serviceError_returns500() throws Exception {
        when(propertyService.getAll()).thenThrow(new RuntimeException("DB error"));

        mockMvc.perform(get("/api/properties/all"))
                .andExpect(status().isInternalServerError());
    }

    // ── GET /api/properties/{id} ───────────────────────────────────

    @Test
    @DisplayName("GET /{id} — 200 for existing property (public)")
    void getById_existing_returns200() throws Exception {
        when(propertyService.getById(1L)).thenReturn(buildPropertyDetails());

        mockMvc.perform(get("/api/properties/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.property.propertyId").value(1));
    }

    @Test
    @DisplayName("GET /{id} — 404 for non-existent property")
    void getById_notFound_returns404() throws Exception {
        when(propertyService.getById(999L)).thenThrow(new RuntimeException("Property not found"));

        mockMvc.perform(get("/api/properties/999"))
                .andExpect(status().isNotFound());
    }

    // ── GET /api/properties/search ─────────────────────────────────

    @Test
    @DisplayName("GET /search — 200 with results (public)")
    void search_public_returns200() throws Exception {
        when(propertyService.searchByPrefix("villa")).thenReturn(List.of(buildPropertyDetails()));

        mockMvc.perform(get("/api/properties/search").param("prefix", "villa"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // ── GET /api/properties/filter ─────────────────────────────────

    @Test
    @DisplayName("GET /filter — 200 for city=Riyadh (public)")
    void filter_byCity_returns200() throws Exception {
        when(propertyService.filterProperties(eq("Riyadh"), any(), any(), any(), any(), any()))
                .thenReturn(List.of(buildPropertyDetails()));

        mockMvc.perform(get("/api/properties/filter").param("city", "Riyadh"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].property.city").value("Riyadh"));
    }

    // ── POST /api/properties/add ───────────────────────────────────

    @Test
    @DisplayName("POST /add — 201 for ADMIN user")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void addProperty_asAdmin_returns201() throws Exception {
        CreatePropertyRequest req = TestFixtures.validCreatePropertyRequest();
        when(userService.getCurrentUser("admin@test.com")).thenReturn(TestFixtures.adminUser());
        when(propertyService.addProperty(any(), eq(1))).thenReturn(buildPropertyDetails());

        mockMvc.perform(post("/api/properties/add")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /add — 403 for TENANT user (missing @PreAuthorize)")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void addProperty_asTenant_returns403() throws Exception {
        CreatePropertyRequest req = TestFixtures.validCreatePropertyRequest();

        mockMvc.perform(post("/api/properties/add")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /add — 401 for unauthenticated")
    void addProperty_unauthenticated_returns401() throws Exception {
        CreatePropertyRequest req = TestFixtures.validCreatePropertyRequest();

        mockMvc.perform(post("/api/properties/add")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // ── PUT /api/properties/{id}/update ───────────────────────────

    @Test
    @DisplayName("PUT /{id}/update — 200 for authenticated owner")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void updateProperty_asOwner_returns200() throws Exception {
        UpdatePropertyRequest req = UpdatePropertyRequest.builder().title("Updated").build();
        when(userService.getCurrentUser("admin@test.com")).thenReturn(TestFixtures.adminUser());
        doNothing().when(propertyService).updateByOwner(eq(1L), any(), eq(1));

        mockMvc.perform(put("/api/properties/1/update")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /{id}/update — 403 when not owner")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void updateProperty_notOwner_returns403() throws Exception {
        UpdatePropertyRequest req = UpdatePropertyRequest.builder().title("Hijack").build();
        when(userService.getCurrentUser("admin@test.com")).thenReturn(TestFixtures.adminUser());
        doThrow(new IllegalArgumentException("do not have permission"))
                .when(propertyService).updateByOwner(anyLong(), any(), anyInt());

        mockMvc.perform(put("/api/properties/1/update")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    // ── DELETE /api/properties/{id}/delete ────────────────────────

    @Test
    @DisplayName("DELETE /{id}/delete — 200 for authenticated owner")
    @WithMockUser(username = "admin@test.com", roles = {"ADMIN"})
    void deleteProperty_asOwner_returns200() throws Exception {
        when(userService.getCurrentUser("admin@test.com")).thenReturn(TestFixtures.adminUser());
        doNothing().when(propertyService).deleteByOwner(eq(1L), eq(1));

        mockMvc.perform(delete("/api/properties/1/delete").with(csrf()))
                .andExpect(status().isOk());
    }

    // ── POST /api/properties/{propertyId}/favorite ─────────────────

    @Test
    @DisplayName("POST /{propertyId}/favorite — 200 for authenticated user")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void favorite_authenticated_returns200() throws Exception {
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(TestFixtures.tenantUser());
        Favorite fav = Favorite.builder()
                .user(TestFixtures.tenantUser())
                .propertyDetails(buildPropertyDetails())
                .build();
        when(propertyService.favorite(1, 2)).thenReturn(fav);

        mockMvc.perform(post("/api/properties/1/favorite").with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /{propertyId}/favorite — 401 for unauthenticated")
    void favorite_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/properties/1/favorite").with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /api/properties/favorites/all ─────────────────────────

    @Test
    @DisplayName("GET /favorites/all — 200 for authenticated user")
    @WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void getAllFavorites_authenticated_returns200() throws Exception {
        when(userService.getCurrentUser("tenant@test.com")).thenReturn(TestFixtures.tenantUser());
        when(propertyService.getAllFavorites(2)).thenReturn(List.of());

        mockMvc.perform(get("/api/properties/favorites/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
