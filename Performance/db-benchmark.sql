-- RentSphere index benchmark: runs the exact repository query shapes against
-- the seeded 100k-listing dataset and shows which index the optimizer picks.
-- Usage: docker compose exec -T mysql mysql -N RentSphereSchema -urentsphere -prentsphere123 < Performance/db-benchmark.sql

SELECT '=== INDEX INVENTORY (must show 12 explicit non-unique indexes) ===' AS section;
SELECT TABLE_NAME, INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS cols
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'RentSphereSchema' AND NON_UNIQUE = 1 AND INDEX_NAME != 'PRIMARY'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;

SELECT '=== 1. filter: city+district+availability+price range (PropertyRepository.filterProperties) ===' AS section;
EXPLAIN SELECT * FROM properties
WHERE is_available = 1 AND city = 'Cairo' AND district = 'District-1'
  AND price_per_month >= 1500 AND price_per_month <= 6500;

SELECT '=== 2. filter: city only ===' AS section;
EXPLAIN SELECT * FROM properties WHERE is_available = 1 AND city = 'Cairo';

SELECT '=== 3. owner listings (idx_properties_owner / FK) ===' AS section;
EXPLAIN SELECT * FROM properties WHERE owner_id = 42;

SELECT '=== 4. images per property ===' AS section;
EXPLAIN SELECT * FROM property_images WHERE property_id = 500;

SELECT '=== 5. favorites per tenant ===' AS section;
EXPLAIN SELECT * FROM favorites WHERE tenant_id = 77 ORDER BY saved_at DESC;

SELECT '=== 6. contracts by tenant / owner ===' AS section;
EXPLAIN SELECT * FROM contracts WHERE tenant_id = 21;
EXPLAIN SELECT * FROM contracts WHERE owner_id = 21;

SELECT '=== 7. payments by contract ===' AS section;
EXPLAIN SELECT * FROM payments WHERE contract_id = 100 ORDER BY installment_no;

SELECT '=== 8. daily scheduler: due-date payments (idx_payments_due_date) ===' AS section;
EXPLAIN SELECT p.* FROM payments p JOIN contracts c ON c.contract_id = p.contract_id
WHERE p.payment_status = 'PENDING' AND p.due_date = CURDATE();

SELECT '=== 9. notifications: recipient unread (idx_notifications_read) ===' AS section;
EXPLAIN SELECT * FROM notifications WHERE recipient_id = 101 AND is_read = 0 ORDER BY created_at DESC;

SELECT '=== 10. rental requests by tenant ===' AS section;
EXPLAIN SELECT * FROM rental_requests WHERE tenant_id = 15;

SELECT '=== 11. TABLE SIZES ===' AS section;
SELECT TABLE_NAME, TABLE_ROWS, ROUND(DATA_LENGTH/1024/1024,1) AS data_mb, ROUND(INDEX_LENGTH/1024/1024,1) AS index_mb
FROM information_schema.TABLES WHERE TABLE_SCHEMA='RentSphereSchema' ORDER BY TABLE_ROWS DESC;
