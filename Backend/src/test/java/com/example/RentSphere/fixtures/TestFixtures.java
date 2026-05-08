package com.example.RentSphere.fixtures;

import com.example.RentSphere.Dto.*;

import java.time.LocalDateTime;

/**
 * Reusable test data factories.
 * Each factory method returns a DTO object suitable for use in tests.
 */
public class TestFixtures {

    // ── Users ──────────────────────────────────────────────────────

    public static User adminUser() {
        return User.builder()
                .user_id(1)
                .email("admin@test.com")
                .username("adminuser")
                .full_name("Admin User")
                .role_name("ADMIN")
                .is_active(true)
                .created_at(LocalDateTime.now())
                .updated_at(LocalDateTime.now())
                .build();
    }

    public static User tenantUser() {
        return User.builder()
                .user_id(2)
                .email("tenant@test.com")
                .username("tenantuser")
                .full_name("Tenant User")
                .role_name("TENANT")
                .is_active(true)
                .created_at(LocalDateTime.now())
                .updated_at(LocalDateTime.now())
                .build();
    }

    public static User visitorUser() {
        return User.builder()
                .user_id(3)
                .email("visitor@test.com")
                .username("visitoruser")
                .full_name("Visitor User")
                .role_name("VISITOR")
                .is_active(true)
                .created_at(LocalDateTime.now())
                .updated_at(LocalDateTime.now())
                .build();
    }

    // ── Registration / Login Requests ──────────────────────────────

    public static RegisterRequest validRegisterRequest() {
        return RegisterRequest.builder()
                .email("newuser@test.com")
                .password_hash("password123")
                .username("newuser")
                .full_name("New User")
                .mobile_number("0501234567")
                .avatar_url(null)
                .build();
    }

    public static LoginRequest validAdminLoginRequest() {
        return LoginRequest.builder()
                .email("admin@test.com")
                .password_hash("password123")
                .build();
    }

    public static LoginRequest validTenantLoginRequest() {
        return LoginRequest.builder()
                .email("tenant@test.com")
                .password_hash("password123")
                .build();
    }

    public static LoginRequest invalidLoginRequest() {
        return LoginRequest.builder()
                .email("nobody@test.com")
                .password_hash("wrongpassword")
                .build();
    }

    // ── Property ───────────────────────────────────────────────────

    public static Property testProperty() {
        return Property.builder()
                .propertyId(1)
                .ownerId(1)
                .propertyType("APARTMENT")
                .title("Test Apartment")
                .propertyDescription("A nice test apartment")
                .pricePerMonth(1500.0)
                .city("Riyadh")
                .district("Al Olaya")
                .address("123 Main St")
                .numRooms(3)
                .areaSqm(110.0)
                .isAvailable(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public static CreatePropertyRequest validCreatePropertyRequest() {
        return CreatePropertyRequest.builder()
                .propertyType("APARTMENT")
                .title("New Test Property")
                .propertyDescription("Description here")
                .pricePerMonth(2000.0)
                .city("Riyadh")
                .district("Al Malqa")
                .address("789 Test St")
                .numRooms(2)
                .areaSqm(80.0)
                .isAvailable(true)
                .build();
    }

    // ── Rental Request ─────────────────────────────────────────────

    public static CreateRentalRequest validCreateRentalRequest() {
        return CreateRentalRequest.builder()
                .propertyId(1)
                .message("I want to rent this property")
                .desiredStart("2025-01-01")
                .desiredMonths(12)
                .build();
    }

    public static RentalRequest pendingRentalRequest() {
        return RentalRequest.builder()
                .rentalReqId(1)
                .propertyId(1)
                .tenantId(2)
                .message("Test rental request")
                .desiredStart("2025-01-01")
                .desiredMonths(12)
                .reqStatus("PENDING")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ── Contract ───────────────────────────────────────────────────

    public static Contract activeContract() {
        return Contract.builder()
                .contractId(1)
                .rentalRequestId(1)
                .propertyId(1)
                .ownerId(1)
                .tenantId(2)
                .contractStatus("ACTIVE")
                .rentAmount(1500.0)
                .durationMonths(12)
                .startDate("2025-01-01")
                .endDate("2026-01-01")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
