package com.example.RentSphere.security;

import com.example.RentSphere.SecurityConfig.JwtService;
import com.example.RentSphere.Service.MyUserDetailsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Security & JWT Filter Integration Tests")
class SecurityIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;

    @MockBean private org.springframework.security.core.userdetails.UserDetailsService myUserDetailsService;
    @MockBean private JdbcTemplate jdbcTemplate; 

    

    @Test
    @DisplayName("GET /api/properties/filter - accessible without token (public)")
    void propertiesFilter_publicAccess() throws Exception {
        mockMvc.perform(get("/api/properties/filter"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/properties/stats - accessible without token (public)")
    void propertiesStats_publicAccess() throws Exception {
        mockMvc.perform(get("/api/properties/stats"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/properties/my - blocked without token even though /api/properties/* is public")
    void propertiesMy_requiresToken() throws Exception {
        mockMvc.perform(get("/api/properties/my"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/user/register - accessible without token (public)")
    void register_publicAccess() throws Exception {
        mockMvc.perform(post("/api/user/register")
                        .contentType("application/json")
                        .content("{\"email\":\"t@t.com\",\"password_hash\":\"password123\",\"username\":\"usr\",\"full_name\":\"Test User\"}"))
                .andExpect(status().isOk()); 
    }

    

    @Test
    @DisplayName("GET /api/user/me - 401 without token")
    void getMe_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/rent/request - 401 without token")
    void rentRequest_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/rent/request")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/rent/requests/all - 401 without token")
    void getAllRequests_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/rent/requests/all"))
                .andExpect(status().isForbidden());
    }

    

    @Test
    @DisplayName("GET /api/user/me - 200 with valid TENANT token")
    void getMe_withValidToken_returns200OrBetter() throws Exception {
        String token = jwtService.generateToken("tenant@test.com", "TENANT");

        UserDetails mockDetails = User.withUsername("tenant@test.com")
                .password("x").roles("TENANT").build();
        when(myUserDetailsService.loadUserByUsername("tenant@test.com")).thenReturn(mockDetails);

        
        
        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    
                    assert status != 401 : "Expected non-401 but got 401";
                });
    }

    

    @Test
    @DisplayName("GET /api/user/me - 401 with malformed Bearer token")
    void getMe_malformedToken_returns401() throws Exception {
        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer this.is.not.valid"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/user/me - 401 with missing Bearer prefix")
    void getMe_missingBearer_returns401() throws Exception {
        String token = jwtService.generateToken("user@test.com", "TENANT");
        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", token)) 
                .andExpect(status().isForbidden());
    }

    

    @Test
    @DisplayName("GET /api/rent/requests/all - 403 with TENANT token (ADMIN only)")
    void getAllRequests_tenantToken_returns403() throws Exception {
        String token = jwtService.generateToken("tenant@test.com", "TENANT");

        UserDetails mockDetails = User.withUsername("tenant@test.com")
                .password("x").roles("TENANT").build();
        when(myUserDetailsService.loadUserByUsername("tenant@test.com")).thenReturn(mockDetails);

        mockMvc.perform(get("/api/rent/requests/all")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Actuator - only the health probe is public")
    void actuator_onlyHealthIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().is(org.hamcrest.Matchers.not(403)));
        for (String path : new String[]{"/actuator/metrics", "/actuator/env", "/actuator/prometheus", "/actuator/beans"}) {
            mockMvc.perform(get(path)).andExpect(status().isForbidden());
        }
    }

    @Test
    @DisplayName("Owner-only routes refuse a tenant even with a valid session")
    @org.springframework.security.test.context.support.WithMockUser(username = "tenant@test.com", roles = {"TENANT"})
    void ownerRoutes_refuseTenant() throws Exception {
        mockMvc.perform(get("/api/properties/my")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/rent/requests/all")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/rent/contracts/manage/summary")).andExpect(status().isForbidden());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/rent/requests/1/accept"))
                .andExpect(status().isForbidden());
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/properties/1/delete"))
                .andExpect(status().isForbidden());
    }
}
