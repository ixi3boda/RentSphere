-- RentSphere sample dataset (small, realistic, hand-planned).
--
-- Load Schema.sql first, then this file:
--   docker compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" RentSphereSchema < Database/Schema.sql
--   docker compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" RentSphereSchema < Database/seed-demo.sql
--
-- What it contains: 1 listing owner (ADMIN) and 3 tenants, 9 listings across
-- Cairo, New Cairo, 6th of October, Sheikh Zayed, Alexandria, Giza and Riyadh
-- with 11 photos, 8 rental requests (4 accepted, 3 pending, 1 rejected),
-- 4 contracts, one monthly installment row per contract month (6 settled),
-- 8 favourites and the notifications the services wrote along the way.
--
-- The rows were produced by driving the public API (register -> add property ->
-- images/add -> favorite -> rent/request -> requests/{id}/accept ->
-- contracts/{id}/card-payment) and dumping the result, so every row here is a
-- row the application itself knows how to create.
--
-- Demo logins share the password 'RentSphereDemo2026'; password_hash holds the
-- BCrypt digest the API generated, not the plain text.
--   owner   (ADMIN)  nour.elsayed@nilenest.demo
--   tenants          youssef.farouk@mail.demo, salma.abdelnabi@mail.demo,
--                    mariam.elhosseiny@mail.demo
--
-- This is the dataset the README screenshots show. For load testing use
-- Database/seed-large-dataset.sql instead (100k listings); it truncates first,
-- so running one after the other is safe.

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


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`user_id`, `full_name`, `email`, `username`, `role_name`, `password_hash`, `mobile_number`, `avatar_url`, `is_active`, `created_at`, `updated_at`) VALUES (1,'Nour El-Sayed','nour.elsayed@nilenest.demo','nour.nilenest','ADMIN','$2a$10$cw7X5WA5F7tmiTR6T3A.Zu2D1uKDlpdIwO.VNmwd3cTnXHbsVeboK','+20 100 552 4118',NULL,1,'2026-09-30 23:24:22','2026-09-30 23:24:23');
INSERT INTO `users` (`user_id`, `full_name`, `email`, `username`, `role_name`, `password_hash`, `mobile_number`, `avatar_url`, `is_active`, `created_at`, `updated_at`) VALUES (2,'Youssef Farouk','youssef.farouk@mail.demo','yousseff','TENANT','$2a$10$J8J7LWFcHEJAcQMfA90wge2XXvDMgcYjkdiIozfkRscvdSpIzdN3q','+20 111 738 2064',NULL,1,'2026-09-30 23:24:23','2026-09-30 23:24:23');
INSERT INTO `users` (`user_id`, `full_name`, `email`, `username`, `role_name`, `password_hash`, `mobile_number`, `avatar_url`, `is_active`, `created_at`, `updated_at`) VALUES (3,'Salma Abdel-Nabi','salma.abdelnabi@mail.demo','salmaa','TENANT','$2a$10$0qweYh6283hiswrTV5Brp.yEybSgRbGz8WXTxTQR7lwYiLlAWObYu','+20 106 640 9932',NULL,1,'2026-09-30 23:24:23','2026-09-30 23:24:23');
INSERT INTO `users` (`user_id`, `full_name`, `email`, `username`, `role_name`, `password_hash`, `mobile_number`, `avatar_url`, `is_active`, `created_at`, `updated_at`) VALUES (4,'Mariam El-Hosseiny','mariam.elhosseiny@mail.demo','mariamh','TENANT','$2a$10$7sZbPyKrdObyiQ6/FQLYDu0qNYdN..Z7cchY3GzhU7kr4K0OprglW','+20 122 415 7780',NULL,1,'2026-09-30 23:24:23','2026-09-30 23:24:23');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `properties` WRITE;
/*!40000 ALTER TABLE `properties` DISABLE KEYS */;
INSERT INTO `properties` (`property_id`, `owner_id`, `property_type`, `title`, `property_description`, `price_per_month`, `city`, `district`, `address`, `latitude`, `longitude`, `num_rooms`, `area_sqm`, `is_available`, `created_at`, `updated_at`) VALUES (1,1,'APARTMENT','Sunlit 2-Bedroom Apartment on Degory Street','Two bedrooms and a reception on a quiet street in Old Maadi, third floor with lift, half a mile from the American Club shops. Furnished, gas and water included.',650.00,'Cairo','Maadi','14 Degory Street, Old Maadi',30.006400,31.251500,2,125.00,0,'2026-09-30 23:24:23','2026-09-30 23:24:23');
INSERT INTO `properties` (`property_id`, `owner_id`, `property_type`, `title`, `property_description`, `price_per_month`, `city`, `district`, `address`, `latitude`, `longitude`, `num_rooms`, `area_sqm`, `is_available`, `created_at`, `updated_at`) VALUES (2,1,'STUDIO','Furnished Studio Steps from the AUC Gate','Compact studio in a secured building on the 90th Street, fitted kitchenette, balcony, gym and roof access. Utilities metered. Ideal for one person or a couple.',420.00,'New Cairo','Tagamoa','Apt 704, Nile Business Park, 90th St',30.044400,31.480600,1,48.00,1,'2026-09-30 23:24:23','2026-09-30 23:24:23');
INSERT INTO `properties` (`property_id`, `owner_id`, `property_type`, `title`, `property_description`, `price_per_month`, `city`, `district`, `address`, `latitude`, `longitude`, `num_rooms`, `area_sqm`, `is_available`, `created_at`, `updated_at`) VALUES (3,1,'VILLA','Family Villa with Private Pool, Palm Hills Extension','Detached villa on Wahat Road: four bedrooms, two bathrooms, a landscaped garden and a private pool. Servants\' quarter, two-car garage, 24-hour compound security.',1500.00,'6th of October','Palm Hills','Villa 14, Al Rehab Extension, Wahat Road',30.008900,30.936800,4,320.00,0,'2026-09-30 23:24:23','2026-09-30 23:24:23');
INSERT INTO `properties` (`property_id`, `owner_id`, `property_type`, `title`, `property_description`, `price_per_month`, `city`, `district`, `address`, `latitude`, `longitude`, `num_rooms`, `area_sqm`, `is_available`, `created_at`, `updated_at`) VALUES (4,1,'APARTMENT','Three Bedrooms with an Unbroken View of the Pyramids','Corner apartment on the last floor of a small building in Hadayek Pyramids. West-facing terrace, three bedrooms, two bathrooms, parking in the basement.',900.00,'Sheikh Zayed','Hadayek Pyramids','Apt 12, El Mostakbal Road',30.013100,30.977800,3,165.00,1,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `properties` (`property_id`, `owner_id`, `property_type`, `title`, `property_description`, `price_per_month`, `city`, `district`, `address`, `latitude`, `longitude`, `num_rooms`, `area_sqm`, `is_available`, `created_at`, `updated_at`) VALUES (5,1,'APARTMENT','Sea-View Apartment on the Alexandria Corniche','Reception and two bedrooms facing the Mediterranean in Roushdi, refitted last summer, two balconies, storage room, and the tram stop at the corner.',780.00,'Alexandria','Roushdi','17 Shmonin Street, Corniche',31.200900,29.926800,2,140.00,0,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `properties` (`property_id`, `owner_id`, `property_type`, `title`, `property_description`, `price_per_month`, `city`, `district`, `address`, `latitude`, `longitude`, `num_rooms`, `area_sqm`, `is_available`, `created_at`, `updated_at`) VALUES (6,1,'STUDIO','Quiet Studio behind Bibliotheca Alexandrina','Single room with kitchenette and bathroom in a restored Al Ibraheeyah building, four minutes on foot from the library and the corniche. Bills excluded.',300.00,'Alexandria','Al Ibraheeyah','5 El Geish Street, off Nebi Daniel',31.208600,29.909700,1,40.00,1,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `properties` (`property_id`, `owner_id`, `property_type`, `title`, `property_description`, `price_per_month`, `city`, `district`, `address`, `latitude`, `longitude`, `num_rooms`, `area_sqm`, `is_available`, `created_at`, `updated_at`) VALUES (7,1,'OFFICE','Open-Plan Office Suite in Smart Village','Fourth floor suite with two meeting rooms and a server corner, 210 sqm, raised floor, backup power and two parking badges. Fit-out available on request.',1200.00,'Giza','Smart Village','Building B2, Floor 4, km 28 Cairo-Alexandria Rd',30.054700,30.915500,3,210.00,1,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `properties` (`property_id`, `owner_id`, `property_type`, `title`, `property_description`, `price_per_month`, `city`, `district`, `address`, `latitude`, `longitude`, `num_rooms`, `area_sqm`, `is_available`, `created_at`, `updated_at`) VALUES (8,1,'APARTMENT','Furnished Two-Bedroom in Al Malqa, North Riyadh','Bright apartment in a gated compound near Al Yasmin: master bedroom with en-suite, maid\'s room, central AC, family gym and a shaded children\'s play area.',930.00,'Riyadh','Al Malqa','Al Yasmin District, Ibn Al Aas Street',24.803500,46.663000,2,110.00,1,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `properties` (`property_id`, `owner_id`, `property_type`, `title`, `property_description`, `price_per_month`, `city`, `district`, `address`, `latitude`, `longitude`, `num_rooms`, `area_sqm`, `is_available`, `created_at`, `updated_at`) VALUES (9,1,'DUPLEX','Modern Duplex with Private Garden in North Katameya','Three-storey duplex in a small compound: reception and kitchen on the ground floor, three bedrooms upstairs, roof terrace, and a fenced garden with an automatic gate.',1100.00,'New Cairo','Katameya','Unit 9, North Katameya Compound',30.027300,31.472600,3,190.00,0,'2026-09-30 23:24:24','2026-09-30 23:24:24');
/*!40000 ALTER TABLE `properties` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `property_images` WRITE;
/*!40000 ALTER TABLE `property_images` DISABLE KEYS */;
INSERT INTO `property_images` (`property_img_id`, `property_id`, `image_url`, `is_cover`, `uploaded_at`) VALUES (1,1,'/uploads/demo/maadi-living.jpg',1,'2026-09-30 23:24:23');
INSERT INTO `property_images` (`property_img_id`, `property_id`, `image_url`, `is_cover`, `uploaded_at`) VALUES (2,1,'/uploads/demo/maadi-kitchen.jpg',0,'2026-09-30 23:24:23');
INSERT INTO `property_images` (`property_img_id`, `property_id`, `image_url`, `is_cover`, `uploaded_at`) VALUES (3,1,'/uploads/demo/maadi-bedroom.jpg',0,'2026-09-30 23:24:23');
INSERT INTO `property_images` (`property_img_id`, `property_id`, `image_url`, `is_cover`, `uploaded_at`) VALUES (4,2,'/uploads/demo/newcairo-studio.jpg',1,'2026-09-30 23:24:23');
INSERT INTO `property_images` (`property_img_id`, `property_id`, `image_url`, `is_cover`, `uploaded_at`) VALUES (5,3,'/uploads/demo/october-villa.jpg',1,'2026-09-30 23:24:23');
INSERT INTO `property_images` (`property_img_id`, `property_id`, `image_url`, `is_cover`, `uploaded_at`) VALUES (6,4,'/uploads/demo/sheikhzayed-view.jpg',1,'2026-09-30 23:24:24');
INSERT INTO `property_images` (`property_img_id`, `property_id`, `image_url`, `is_cover`, `uploaded_at`) VALUES (7,5,'/uploads/demo/corniche-sea.jpg',1,'2026-09-30 23:24:24');
INSERT INTO `property_images` (`property_img_id`, `property_id`, `image_url`, `is_cover`, `uploaded_at`) VALUES (8,6,'/uploads/demo/alex-studio.jpg',1,'2026-09-30 23:24:24');
INSERT INTO `property_images` (`property_img_id`, `property_id`, `image_url`, `is_cover`, `uploaded_at`) VALUES (9,7,'/uploads/demo/smartvillage-office.jpg',1,'2026-09-30 23:24:24');
INSERT INTO `property_images` (`property_img_id`, `property_id`, `image_url`, `is_cover`, `uploaded_at`) VALUES (10,8,'/uploads/demo/riyadh-malqa.jpg',1,'2026-09-30 23:24:24');
INSERT INTO `property_images` (`property_img_id`, `property_id`, `image_url`, `is_cover`, `uploaded_at`) VALUES (11,9,'/uploads/demo/heliopolis-duplex.jpg',1,'2026-09-30 23:24:24');
/*!40000 ALTER TABLE `property_images` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` (`tenant_id`, `property_id`, `saved_at`) VALUES (2,2,'2026-09-30 23:24:24');
INSERT INTO `favorites` (`tenant_id`, `property_id`, `saved_at`) VALUES (2,4,'2026-09-30 23:24:24');
INSERT INTO `favorites` (`tenant_id`, `property_id`, `saved_at`) VALUES (2,7,'2026-09-30 23:24:24');
INSERT INTO `favorites` (`tenant_id`, `property_id`, `saved_at`) VALUES (3,1,'2026-09-30 23:24:24');
INSERT INTO `favorites` (`tenant_id`, `property_id`, `saved_at`) VALUES (3,3,'2026-09-30 23:24:24');
INSERT INTO `favorites` (`tenant_id`, `property_id`, `saved_at`) VALUES (3,9,'2026-09-30 23:24:24');
INSERT INTO `favorites` (`tenant_id`, `property_id`, `saved_at`) VALUES (4,5,'2026-09-30 23:24:24');
INSERT INTO `favorites` (`tenant_id`, `property_id`, `saved_at`) VALUES (4,6,'2026-09-30 23:24:24');
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `rental_requests` WRITE;
/*!40000 ALTER TABLE `rental_requests` DISABLE KEYS */;
INSERT INTO `rental_requests` (`rental_req_id`, `property_id`, `tenant_id`, `message`, `desired_start`, `desired_months`, `req_status`, `reviewed_at`, `created_at`, `updated_at`) VALUES (1,1,2,'Moving with my wife for a job at the American University; we would like a two-year contract if the rent holds.','2026-11-01',12,'ACCEPTED','2026-09-30 23:24:24','2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `rental_requests` (`rental_req_id`, `property_id`, `tenant_id`, `message`, `desired_start`, `desired_months`, `req_status`, `reviewed_at`, `created_at`, `updated_at`) VALUES (2,2,2,'Single tenant, working remotely, no pets. Could view any weekday evening.','2026-11-01',12,'PENDING',NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `rental_requests` (`rental_req_id`, `property_id`, `tenant_id`, `message`, `desired_start`, `desired_months`, `req_status`, `reviewed_at`, `created_at`, `updated_at`) VALUES (3,6,2,'Student at Alexandria University, summer sublet wanted.','2026-11-01',6,'REJECTED','2026-09-30 23:24:25','2026-09-30 23:24:24','2026-09-30 23:24:25');
INSERT INTO `rental_requests` (`rental_req_id`, `property_id`, `tenant_id`, `message`, `desired_start`, `desired_months`, `req_status`, `reviewed_at`, `created_at`, `updated_at`) VALUES (4,3,3,'Family of four with two children, references from a previous tenancy in Sheikh Zayed available.','2026-11-01',12,'ACCEPTED','2026-09-30 23:24:24','2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `rental_requests` (`rental_req_id`, `property_id`, `tenant_id`, `message`, `desired_start`, `desired_months`, `req_status`, `reviewed_at`, `created_at`, `updated_at`) VALUES (5,4,3,'Looking for a long lease for my parents; they do not need furnishing.','2026-11-01',12,'PENDING',NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `rental_requests` (`rental_req_id`, `property_id`, `tenant_id`, `message`, `desired_start`, `desired_months`, `req_status`, `reviewed_at`, `created_at`, `updated_at`) VALUES (6,8,3,'Secondment in Riyadh from December, would need the furnished option.','2026-11-01',9,'PENDING',NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `rental_requests` (`rental_req_id`, `property_id`, `tenant_id`, `message`, `desired_start`, `desired_months`, `req_status`, `reviewed_at`, `created_at`, `updated_at`) VALUES (7,5,4,'Work at the Bibliotheca, sea view preferred over size.','2026-11-01',12,'ACCEPTED','2026-09-30 23:24:25','2026-09-30 23:24:24','2026-09-30 23:24:25');
INSERT INTO `rental_requests` (`rental_req_id`, `property_id`, `tenant_id`, `message`, `desired_start`, `desired_months`, `req_status`, `reviewed_at`, `created_at`, `updated_at`) VALUES (8,9,4,'Two adults and a small dog, happy to pay three months up front.','2026-11-01',12,'ACCEPTED','2026-09-30 23:24:25','2026-09-30 23:24:24','2026-09-30 23:24:25');
/*!40000 ALTER TABLE `rental_requests` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `contracts` WRITE;
/*!40000 ALTER TABLE `contracts` DISABLE KEYS */;
INSERT INTO `contracts` (`contract_id`, `rental_request_id`, `property_id`, `owner_id`, `tenant_id`, `contract_status`, `rent_amount`, `duration_months`, `start_date`, `end_date`, `pdf_url`, `notes`, `created_at`, `updated_at`) VALUES (1,1,1,1,2,'ACTIVE',650.00,12,'2026-11-01','2027-11-01',NULL,'Auto-generated contract after rental approval','2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `contracts` (`contract_id`, `rental_request_id`, `property_id`, `owner_id`, `tenant_id`, `contract_status`, `rent_amount`, `duration_months`, `start_date`, `end_date`, `pdf_url`, `notes`, `created_at`, `updated_at`) VALUES (2,4,3,1,3,'ACTIVE',1500.00,12,'2026-11-01','2027-11-01',NULL,'Auto-generated contract after rental approval','2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `contracts` (`contract_id`, `rental_request_id`, `property_id`, `owner_id`, `tenant_id`, `contract_status`, `rent_amount`, `duration_months`, `start_date`, `end_date`, `pdf_url`, `notes`, `created_at`, `updated_at`) VALUES (3,7,5,1,4,'ACTIVE',780.00,12,'2026-11-01','2027-11-01',NULL,'Auto-generated contract after rental approval','2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `contracts` (`contract_id`, `rental_request_id`, `property_id`, `owner_id`, `tenant_id`, `contract_status`, `rent_amount`, `duration_months`, `start_date`, `end_date`, `pdf_url`, `notes`, `created_at`, `updated_at`) VALUES (4,8,9,1,4,'ACTIVE',1100.00,12,'2026-11-01','2027-11-01',NULL,'Auto-generated contract after rental approval','2026-09-30 23:24:25','2026-09-30 23:24:25');
/*!40000 ALTER TABLE `contracts` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (1,1,'PAID',1,'2026-11-01','2026-09-30 23:24:25',650.00,650.00,'CC-PAY-29697E6E',NULL,'2026-09-30 23:24:24','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (2,1,'PAID',2,'2026-12-01','2026-09-30 23:24:25',650.00,650.00,'CC-PAY-8D7BD442',NULL,'2026-09-30 23:24:24','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (3,1,'PAID',3,'2027-01-01','2026-09-30 23:24:25',650.00,650.00,'CC-PAY-A51782C2',NULL,'2026-09-30 23:24:24','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (4,1,'PENDING',4,'2027-02-01',NULL,650.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (5,1,'PENDING',5,'2027-03-01',NULL,650.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (6,1,'PENDING',6,'2027-04-01',NULL,650.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (7,1,'PENDING',7,'2027-05-01',NULL,650.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (8,1,'PENDING',8,'2027-06-01',NULL,650.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (9,1,'PENDING',9,'2027-07-01',NULL,650.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (10,1,'PENDING',10,'2027-08-01',NULL,650.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (11,1,'PENDING',11,'2027-09-01',NULL,650.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (12,1,'PENDING',12,'2027-10-01',NULL,650.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (13,2,'PAID',1,'2026-11-01','2026-09-30 23:24:25',1500.00,1500.00,'CC-PAY-5229F0A0',NULL,'2026-09-30 23:24:24','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (14,2,'PENDING',2,'2026-12-01',NULL,1500.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (15,2,'PENDING',3,'2027-01-01',NULL,1500.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (16,2,'PENDING',4,'2027-02-01',NULL,1500.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (17,2,'PENDING',5,'2027-03-01',NULL,1500.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (18,2,'PENDING',6,'2027-04-01',NULL,1500.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (19,2,'PENDING',7,'2027-05-01',NULL,1500.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (20,2,'PENDING',8,'2027-06-01',NULL,1500.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (21,2,'PENDING',9,'2027-07-01',NULL,1500.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (22,2,'PENDING',10,'2027-08-01',NULL,1500.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (23,2,'PENDING',11,'2027-09-01',NULL,1500.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (24,2,'PENDING',12,'2027-10-01',NULL,1500.00,0.00,NULL,NULL,'2026-09-30 23:24:24','2026-09-30 23:24:24');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (25,3,'PAID',1,'2026-11-01','2026-09-30 23:24:25',780.00,780.00,'CC-PAY-2B4C1530',NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (26,3,'PAID',2,'2026-12-01','2026-09-30 23:24:25',780.00,780.00,'CC-PAY-26072627',NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (27,3,'PENDING',3,'2027-01-01',NULL,780.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (28,3,'PENDING',4,'2027-02-01',NULL,780.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (29,3,'PENDING',5,'2027-03-01',NULL,780.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (30,3,'PENDING',6,'2027-04-01',NULL,780.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (31,3,'PENDING',7,'2027-05-01',NULL,780.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (32,3,'PENDING',8,'2027-06-01',NULL,780.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (33,3,'PENDING',9,'2027-07-01',NULL,780.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (34,3,'PENDING',10,'2027-08-01',NULL,780.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (35,3,'PENDING',11,'2027-09-01',NULL,780.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (36,3,'PENDING',12,'2027-10-01',NULL,780.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (37,4,'PENDING',1,'2026-11-01',NULL,1100.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (38,4,'PENDING',2,'2026-12-01',NULL,1100.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (39,4,'PENDING',3,'2027-01-01',NULL,1100.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (40,4,'PENDING',4,'2027-02-01',NULL,1100.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (41,4,'PENDING',5,'2027-03-01',NULL,1100.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (42,4,'PENDING',6,'2027-04-01',NULL,1100.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (43,4,'PENDING',7,'2027-05-01',NULL,1100.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (44,4,'PENDING',8,'2027-06-01',NULL,1100.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (45,4,'PENDING',9,'2027-07-01',NULL,1100.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (46,4,'PENDING',10,'2027-08-01',NULL,1100.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (47,4,'PENDING',11,'2027-09-01',NULL,1100.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
INSERT INTO `payments` (`payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref`, `notes`, `created_at`, `updated_at`) VALUES (48,4,'PENDING',12,'2027-10-01',NULL,1100.00,0.00,NULL,NULL,'2026-09-30 23:24:25','2026-09-30 23:24:25');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (1,1,'NEW_REQUEST','New request #1 for property #1','A tenant requested this property for 12 months starting 2026-11-01.',0,'2026-09-30 23:24:24');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (2,1,'NEW_REQUEST','New request #2 for property #2','A tenant requested this property for 12 months starting 2026-11-01.',0,'2026-09-30 23:24:24');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (3,1,'NEW_REQUEST','New request #3 for property #6','A tenant requested this property for 6 months starting 2026-11-01.',0,'2026-09-30 23:24:24');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (4,1,'NEW_REQUEST','New request #4 for property #3','A tenant requested this property for 12 months starting 2026-11-01.',0,'2026-09-30 23:24:24');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (5,1,'NEW_REQUEST','New request #5 for property #4','A tenant requested this property for 12 months starting 2026-11-01.',0,'2026-09-30 23:24:24');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (6,1,'NEW_REQUEST','New request #6 for property #8','A tenant requested this property for 9 months starting 2026-11-01.',0,'2026-09-30 23:24:24');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (7,1,'NEW_REQUEST','New request #7 for property #5','A tenant requested this property for 12 months starting 2026-11-01.',0,'2026-09-30 23:24:24');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (8,1,'NEW_REQUEST','New request #8 for property #9','A tenant requested this property for 12 months starting 2026-11-01.',0,'2026-09-30 23:24:24');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (9,2,'REQUEST_ACCEPTED','Rental request #1 accepted','Your request was accepted and the rental contract is now active.',0,'2026-09-30 23:24:24');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (10,3,'REQUEST_ACCEPTED','Rental request #4 accepted','Your request was accepted and the rental contract is now active.',0,'2026-09-30 23:24:24');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (11,4,'REQUEST_ACCEPTED','Rental request #7 accepted','Your request was accepted and the rental contract is now active.',0,'2026-09-30 23:24:25');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (12,4,'REQUEST_ACCEPTED','Rental request #8 accepted','Your request was accepted and the rental contract is now active.',0,'2026-09-30 23:24:25');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (13,2,'REQUEST_REJECTED','Rental request #3 rejected','The owner of this property declined your rental request.',0,'2026-09-30 23:24:25');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (14,2,'PAYMENT_RECEIVED','Payment Received via Credit Card','Your payment of $650.00 for installment #1 on contract #1 was successfully processed via Credit Card (CC-PAY-29697E6E).',0,'2026-09-30 23:24:25');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (15,3,'PAYMENT_RECEIVED','Payment Received via Credit Card','Your payment of $1500.00 for installment #1 on contract #2 was successfully processed via Credit Card (CC-PAY-5229F0A0).',0,'2026-09-30 23:24:25');
INSERT INTO `notifications` (`noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read`, `created_at`) VALUES (16,4,'PAYMENT_RECEIVED','Payment Received via Credit Card','Your payment of $780.00 for installment #1 on contract #3 was successfully processed via Credit Card (CC-PAY-2B4C1530).',0,'2026-09-30 23:24:25');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

