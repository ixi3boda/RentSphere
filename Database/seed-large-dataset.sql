-- RentSphere load-test seed data
-- Generates a realistically large dataset for index/query benchmarking and
-- JMeter load tests: 5,000 users, 100,000 properties, plus images, favorites,
-- rental requests, contracts, installments and notifications.
-- Usage: docker compose exec -T mysql mysql -urentsphere -p"<MYSQL_PASSWORD from .env>" RentSphereSchema < Database/seed-large-dataset.sql

SET SESSION sql_mode = '';
SET SESSION cte_max_recursion_depth = 1000000;

-- Idempotent re-seed: clear previous benchmark data first.
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notifications;
TRUNCATE TABLE payments;
TRUNCATE TABLE contracts;
TRUNCATE TABLE rental_requests;
TRUNCATE TABLE favorites;
TRUNCATE TABLE property_images;
TRUNCATE TABLE properties;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------- number generators ----------
DROP TABLE IF EXISTS _seed_digits;
CREATE TABLE _seed_digits (n TINYINT PRIMARY KEY);
INSERT INTO _seed_digits VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9);

DROP TABLE IF EXISTS _seed_num;
CREATE TABLE _seed_num (n INT PRIMARY KEY);
INSERT INTO _seed_num
SELECT a.n + b.n*10 + c.n*100 + d.n*1000 + e.n*10000 + 1
FROM _seed_digits a, _seed_digits b, _seed_digits c, _seed_digits d, _seed_digits e;

-- ---------- 5,000 users ----------
INSERT INTO users (full_name, email, username, role_name, password_hash, mobile_number, is_active)
SELECT
    CONCAT('Seed User ', n),
    CONCAT('seed', n, '@loadtest.local'),
    CONCAT('seeduser', n),
    CASE WHEN n % 25 = 0 THEN 'ADMIN' ELSE 'TENANT' END,
    '$2a$10$3n4XK2QFfW0vGZ4xQ8yJhu7k3n2rB0e1pQ9sT6vC8dF0gH2iK4mLc',
    CONCAT('010', LPAD(n, 8, '0')),
    TRUE
FROM _seed_num WHERE n <= 5000;

-- ---------- 100,000 properties ----------
INSERT INTO properties
    (owner_id, property_type, title, property_description, price_per_month,
     city, district, address, latitude, longitude, num_rooms, area_sqm, is_available)
SELECT
    1 + (n * 7919) % 5000,
    ELT(1 + n % 7, 'APARTMENT','STUDIO','VILLA','DUPLEX','OFFICE','SHOP','WAREHOUSE'),
    CONCAT('Listing #', n, ' - ', ELT(1 + n % 7, 'Apartment','Studio','Villa','Duplex','Office','Shop','Warehouse')),
    CONCAT('Generated listing for load testing, ref ', n),
    1500.00 + (n * 997) % 48500,
    ELT(1 + n % 10, 'Cairo','Alexandria','Giza','New Cairo','6th of October',
                     'Mansoura','Tanta','Aswan','Luxor','Sheikh Zayed'),
    CONCAT('District-', 1 + (n DIV 10) % 6),
    CONCAT(n, ', Test Street'),
    30.0 + (n % 300) / 100,
    31.0 + (n % 200) / 100,
    1 + n % 5,
    40.00 + (n % 260),
    (n % 10) < 8
FROM _seed_num WHERE n <= 100000;

-- ---------- 150,000 property images (cover + 2 extras) ----------
INSERT INTO property_images (property_id, image_url, is_cover)
SELECT p.property_id, CONCAT('https://res.cloudinary.com/rentsphere/image/upload/seed_', p.property_id, '_1.jpg'), TRUE
FROM properties p;

INSERT INTO property_images (property_id, image_url, is_cover)
SELECT p.property_id, CONCAT('https://res.cloudinary.com/rentsphere/image/upload/seed_', p.property_id, '_2.jpg'), FALSE
FROM properties p;

INSERT INTO property_images (property_id, image_url, is_cover)
SELECT p.property_id, CONCAT('https://res.cloudinary.com/rentsphere/image/upload/seed_', p.property_id, '_3.jpg'), FALSE
FROM properties p;

-- ---------- 50,000 favorites ----------
INSERT IGNORE INTO favorites (tenant_id, property_id)
SELECT 1 + (n * 31) % 5000, 1 + (n * 137) % 100000
FROM _seed_num WHERE n <= 60000;

-- ---------- 30,000 rental requests ----------
INSERT INTO rental_requests
    (property_id, tenant_id, message, desired_start, desired_months, req_status, reviewed_at)
SELECT
    1 + (n * 71) % 100000,
    1 + (n * 17) % 5000,
    CONCAT('Interested in this unit, ref ', n),
    DATE_ADD('2026-01-01', INTERVAL (n % 180) DAY),
    6 + n % 18,
    ELT(1 + n % 4, 'PENDING','ACCEPTED','REJECTED','CANCELLED'),
    CASE WHEN n % 4 IN (1,2,3) THEN NOW() - INTERVAL (n % 720) HOUR ELSE NULL END
FROM _seed_num WHERE n <= 30000;

-- ---------- contracts for accepted requests (rental_req ids where n%4==1) ----------
INSERT INTO contracts
    (rental_request_id, property_id, owner_id, tenant_id, contract_status,
     rent_amount, duration_months, start_date, end_date)
SELECT
    r.rental_req_id, r.property_id, r.owner_id, r.tenant_id,
    CASE WHEN r.rental_req_id % 8 = 1 THEN 'COMPLETED' ELSE 'ACTIVE' END,
    r.rent, r.months, r.start_date,
    DATE_ADD(r.start_date, INTERVAL r.months MONTH)
FROM (
    SELECT rr.rental_req_id, rr.property_id, rr.tenant_id, rr.desired_start AS start_date,
           rr.desired_months AS months, p.price_per_month AS rent, p.owner_id AS owner_id
    FROM rental_requests rr JOIN properties p ON p.property_id = rr.property_id
    WHERE rr.req_status = 'ACCEPTED'
) r;

-- ---------- 3 installments per contract ----------
INSERT INTO payments (contract_id, payment_status, installment_no, due_date, paid_date, amount_due, amount_paid)
SELECT
    c.contract_id,
    CASE WHEN s.n = 1 AND c.contract_status = 'ACTIVE' THEN 'PAID'
         WHEN s.n = 1 AND c.contract_status = 'COMPLETED' THEN 'PAID'
         ELSE 'PENDING' END,
    s.n,
    DATE_ADD(c.start_date, INTERVAL (s.n - 1) MONTH),
    CASE WHEN s.n = 1 THEN c.start_date + INTERVAL 3 DAY ELSE NULL END,
    c.rent_amount,
    CASE WHEN s.n = 1 THEN c.rent_amount ELSE 0 END
FROM contracts c
JOIN (SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3) s;

-- ---------- 40,000 notifications ----------
INSERT INTO notifications (recipient_id, notification_type, title, body, is_read)
SELECT
    1 + (n * 11) % 5000,
    ELT(1 + n % 8, 'NEW_REQUEST','REQUEST_ACCEPTED','REQUEST_REJECTED','REQUEST_CANCELLED',
                    'CONTRACT_CREATED','CONTRACT_COMPLETED','PAYMENT_REMINDER','PAYMENT_RECEIVED'),
    CONCAT('Seed notification ', n),
    CONCAT('Body for notification ', n),
    (n % 3 = 0)
FROM _seed_num WHERE n <= 40000;

-- ---------- housekeeping ----------
DROP TABLE _seed_num;
DROP TABLE _seed_digits;

ANALYZE TABLE users, properties, property_images, favorites, rental_requests, contracts, payments, notifications;

SELECT
    (SELECT COUNT(*) FROM users)                AS users,
    (SELECT COUNT(*) FROM properties)           AS properties,
    (SELECT COUNT(*) FROM property_images)      AS images,
    (SELECT COUNT(*) FROM favorites)            AS favorites,
    (SELECT COUNT(*) FROM rental_requests)      AS requests,
    (SELECT COUNT(*) FROM contracts)            AS contracts,
    (SELECT COUNT(*) FROM payments)             AS payments,
    (SELECT COUNT(*) FROM notifications)        AS notifications;
