-- ─────────────────────────────────────────────────────────────────
-- Test seed data — inserted before each test run.
-- Passwords are BCrypt of "password123"
-- ─────────────────────────────────────────────────────────────────

-- Seed users
INSERT INTO users (email, password_hash, username, full_name, role_name, is_active, created_at, updated_at)
VALUES
  ('admin@test.com',   '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOs7e35Q0i0R2', 'adminuser',   'Admin User',   'ADMIN',   TRUE, NOW(), NOW()),
  ('tenant@test.com',  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOs7e35Q0i0R2', 'tenantuser',  'Tenant User',  'TENANT',  TRUE, NOW(), NOW()),
  ('visitor@test.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOs7e35Q0i0R2', 'visitoruser', 'Visitor User', 'VISITOR', TRUE, NOW(), NOW());

-- Seed properties (owned by admin user_id=1)
INSERT INTO properties (owner_id, property_type, title, property_description, price_per_month, city, district, address, is_available, created_at, updated_at)
VALUES
  (1, 'APARTMENT', 'Test Apartment',  'A nice apartment', 1500.00, 'Riyadh', 'Al Olaya', '123 Main St', TRUE,  NOW(), NOW()),
  (1, 'VILLA',     'Luxury Villa',    'Spacious villa',   4000.00, 'Jeddah', 'Al Hamra', '456 Park Ave', FALSE, NOW(), NOW());

-- Seed rental request (tenant=2 on property=1)
INSERT INTO rental_requests (property_id, tenant_id, message, desired_start, desired_months, req_status, created_at, updated_at)
VALUES (1, 2, 'I want to rent this', '2024-06-01', 12, 'PENDING', NOW(), NOW());
