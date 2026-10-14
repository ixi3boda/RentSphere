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

@org.springframework.context.annotation.Import({com.example.RentSphere.SecurityConfig.SecConfig.class, com.example.RentSphere.SecurityConfig.JwtAuthenticationFilter.class})
@WebMvcTest(com.example.RentSphere.Controller.PropertyController.class)
@DisplayName("PropertyController MockMvc Tests")
class PropertyControllerTest {

        @Autowired
        private MockMvc mockMvc;
        @Autowired
        private ObjectMapper objectMapper;

        @MockBean
        private PropertyService propertyService;
        @MockBean
        private com.example.RentSphere.Service.ContractService contractService;
        @MockBean
        private UserService userService;
        @MockBean
        private JwtService jwtService;
        @MockBean
        private org.springframework.security.core.userdetails.UserDetailsService myUserDetailsService;

        private PropertyDetails buildPropertyDetails() {
                PropertyDetails pd = new PropertyDetails();
                pd.setProperty(TestFixtures.testProperty());
                pd.setPropertyImages(List.of());
                return pd;
        }

        

        @Test
        @DisplayName("GET /stats - public marketplace counts")
        void getStats_public_returns200() throws Exception {
                when(propertyService.countListings()).thenReturn(100001);
                when(propertyService.countAvailableListings()).thenReturn(80001);
                when(contractService.countActiveContracts()).thenReturn(3751);

                mockMvc.perform(get("/api/properties/stats"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalListings").value(100001))
                                .andExpect(jsonPath("$.availableListings").value(80001))
                                .andExpect(jsonPath("$.activeLeases").value(3751));
        }

        @Test
        @DisplayName("GET /my - scoped to the calling owner")
        @WithMockUser(username = "admin@test.com", roles = { "ADMIN" })
        void getMyProperties_authenticated_returnsOwnOnly() throws Exception {
                when(userService.getCurrentUser("admin@test.com")).thenReturn(TestFixtures.adminUser());
                when(propertyService.getByOwnerId(1)).thenReturn(List.of(buildPropertyDetails()));

                mockMvc.perform(get("/api/properties/my"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].property.propertyId").value(1));
        }

        @Test
        @DisplayName("GET /my - 403 for a tenant, who cannot own listings")
        @WithMockUser(username = "tenant@test.com", roles = { "TENANT" })
        void getMyProperties_asTenant_returns403() throws Exception {
                mockMvc.perform(get("/api/properties/my"))
                                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("POST /{id}/images/add - 400 for a javascript: or data: URL")
        @WithMockUser(username = "admin@test.com", roles = { "ADMIN" })
        void addPropertyImage_unsafeUrl_returns400() throws Exception {
                for (String url : List.of("javascript:alert(1)", "data:image/png;base64,AAAA", "http://plain.example/a.png")) {
                        mockMvc.perform(post("/api/properties/1/images/add")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{\"image_url\":\"" + url + "\"}"))
                                        .andExpect(status().isBadRequest());
                }
                verify(propertyService, never()).addImageByOwner(anyLong(), anyString(), anyBoolean(), anyInt());
        }

        @Test
        @DisplayName("GET /filter - 400 for junk filter values")
        void filter_junkValues_returns400() throws Exception {
                mockMvc.perform(get("/api/properties/filter").param("minPrice", "-5"))
                                .andExpect(status().isBadRequest());
                mockMvc.perform(get("/api/properties/filter").param("maxPrice", "NaN"))
                                .andExpect(status().isBadRequest());
                mockMvc.perform(get("/api/properties/filter").param("search", "x".repeat(101)))
                                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("GET /{id} - a database failure never reaches the response body")
        void getById_databaseError_isNotLeaked() throws Exception {
                when(propertyService.getById(5L)).thenThrow(
                                new org.springframework.dao.DataAccessResourceFailureException("SELECT * FROM properties WHERE secret"));

                mockMvc.perform(get("/api/properties/5"))
                                .andExpect(status().isInternalServerError())
                                .andExpect(jsonPath("$.message").value("Failed to fetch property"));
        }

        

        @Test
        @DisplayName("GET /{id} - 200 for existing property (public)")
        void getById_existing_returns200() throws Exception {
                when(propertyService.getById(1L)).thenReturn(buildPropertyDetails());

                mockMvc.perform(get("/api/properties/1"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.property.propertyId").value(1));
        }

        @Test
        @DisplayName("GET /{id} - 404 for non-existent property")
        void getById_notFound_returns404() throws Exception {
                when(propertyService.getById(999L)).thenThrow(new com.example.RentSphere.Exception.ResourceNotFoundException("Property not found"));

                mockMvc.perform(get("/api/properties/999"))
                                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("GET /{id} - 400 when the id is not a number")
        void getById_nonNumericId_returns400() throws Exception {
                mockMvc.perform(get("/api/properties/abc"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Invalid value for 'id'"));
        }

        @Test
        @DisplayName("GET /filter - 200 for city=Riyadh (public)")
        void filter_byCity_returns200() throws Exception {
                when(propertyService.countFilterProperties(any())).thenReturn(1);
                when(propertyService.filterProperties(any(), anyString(), anyInt(), anyInt()))
                                .thenReturn(List.of(buildPropertyDetails()));

                mockMvc.perform(get("/api/properties/filter").param("city", "Riyadh"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.total").value(1))
                                .andExpect(jsonPath("$.items[0].property.city").value("Riyadh"));
        }

        @Test
        @DisplayName("GET /filter - page and size are clamped, offset derived from page")
        void filter_clampsPageSize() throws Exception {
                when(propertyService.countFilterProperties(any())).thenReturn(0);
                when(propertyService.filterProperties(any(), anyString(), eq(0), eq(48)))
                                .thenReturn(List.of());

                mockMvc.perform(get("/api/properties/filter")
                                .param("page", "-5")
                                .param("size", "100000"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.size").value(48))
                                .andExpect(jsonPath("$.page").value(0));

                verify(propertyService).filterProperties(any(), anyString(), eq(0), eq(48));
        }

        

        @Test
        @DisplayName("POST /add - 201 for ADMIN user")
        @WithMockUser(username = "admin@test.com", roles = { "ADMIN" })
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
        @DisplayName("POST /add - 403 for TENANT user (missing @PreAuthorize)")
        @WithMockUser(username = "tenant@test.com", roles = { "TENANT" })
        void addProperty_asTenant_returns403() throws Exception {
                CreatePropertyRequest req = TestFixtures.validCreatePropertyRequest();

                mockMvc.perform(post("/api/properties/add")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("POST /add - 401 for unauthenticated")
        void addProperty_unauthenticated_returns401() throws Exception {
                CreatePropertyRequest req = TestFixtures.validCreatePropertyRequest();

                mockMvc.perform(post("/api/properties/add")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isForbidden());
        }

        

        @Test
        @DisplayName("PUT /{id}/update - 200 for authenticated owner")
        @WithMockUser(username = "admin@test.com", roles = { "ADMIN" })
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
        @DisplayName("PUT /{id}/update - 403 when not owner")
        @WithMockUser(username = "admin@test.com", roles = { "ADMIN" })
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

        

        @Test
        @DisplayName("DELETE /{id}/delete - 200 for authenticated owner")
        @WithMockUser(username = "admin@test.com", roles = { "ADMIN" })
        void deleteProperty_asOwner_returns200() throws Exception {
                when(userService.getCurrentUser("admin@test.com")).thenReturn(TestFixtures.adminUser());
                doNothing().when(propertyService).deleteByOwner(eq(1L), eq(1));

                mockMvc.perform(delete("/api/properties/1/delete").with(csrf()))
                                .andExpect(status().isOk());
        }

        

        @Test
        @DisplayName("POST /{propertyId}/favorite - 200 for authenticated user")
        @WithMockUser(username = "tenant@test.com", roles = { "TENANT" })
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
        @DisplayName("POST /{propertyId}/favorite - 401 for unauthenticated")
        void favorite_unauthenticated_returns401() throws Exception {
                mockMvc.perform(post("/api/properties/1/favorite").with(csrf()))
                                .andExpect(status().isForbidden());
        }

        

        @Test
        @DisplayName("GET /favorites/all - 200 for authenticated user")
        @WithMockUser(username = "tenant@test.com", roles = { "TENANT" })
        void getAllFavorites_authenticated_returns200() throws Exception {
                when(userService.getCurrentUser("tenant@test.com")).thenReturn(TestFixtures.tenantUser());
                when(propertyService.getAllFavorites(2)).thenReturn(List.of());

                mockMvc.perform(get("/api/properties/favorites/all"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$").isArray());
        }

        @Test
        @DisplayName("POST /{id}/images/add - 200 for authenticated owner")
        @WithMockUser(username = "admin@test.com", roles = { "ADMIN" })
        void addPropertyImage_asOwner_returns200() throws Exception {
                when(userService.getCurrentUser("admin@test.com")).thenReturn(TestFixtures.adminUser());
                doNothing().when(propertyService).addImageByOwner(eq(1L), anyString(), anyBoolean(), eq(1));

                String body = "{\"image_url\":\"https://img.example/a.png\",\"is_cover\":true}";

                mockMvc.perform(post("/api/properties/1/images/add")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("POST /{id}/images/add - 403 when not owner")
        @WithMockUser(username = "admin@test.com", roles = { "ADMIN" })
        void addPropertyImage_notOwner_returns403() throws Exception {
                when(userService.getCurrentUser("admin@test.com")).thenReturn(TestFixtures.adminUser());
                doThrow(new IllegalArgumentException("Not owner"))
                                .when(propertyService).addImageByOwner(anyLong(), anyString(), anyBoolean(), anyInt());

                String body = "{\"image_url\":\"https://img.example/a.png\",\"is_cover\":true}";

                mockMvc.perform(post("/api/properties/1/images/add")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                                .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("POST /{id}/images/add - 404 when property not found")
        @WithMockUser(username = "admin@test.com", roles = { "ADMIN" })
        void addPropertyImage_notFound_returns404() throws Exception {
                when(userService.getCurrentUser("admin@test.com")).thenReturn(TestFixtures.adminUser());
                doThrow(new com.example.RentSphere.Exception.ResourceNotFoundException("Property not found"))
                                .when(propertyService).addImageByOwner(anyLong(), anyString(), anyBoolean(), anyInt());

                String body = "{\"image_url\":\"https://img.example/a.png\",\"is_cover\":true}";

                mockMvc.perform(post("/api/properties/1/images/add")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Unmapped path - 404 rather than a server fault")
        @WithMockUser(username = "someone@test.com", roles = { "TENANT" })
        void unmappedPath_returns404() throws Exception {
                mockMvc.perform(get("/api/definitely-not-an-endpoint"))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.message").value("No endpoint for this request"));
        }
}
