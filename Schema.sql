-- =============================================================================
-- RentSphere Database Schema
-- =============================================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS saved_articles;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS article_categories;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_types;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS payment_statuses;
DROP TABLE IF EXISTS contracts;
DROP TABLE IF EXISTS contract_statuses;
DROP TABLE IF EXISTS rental_requests;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS property_images;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS property_types;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. USER MANAGEMENT
-- =============================================================================

-- 1a. roles  (lookup table)
CREATE TABLE roles (
    id          TINYINT      UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(20)  NOT NULL,           -- OWNER | TENANT | ADMIN
    description VARCHAR(100) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_roles_name UNIQUE (name)
);

-- 1b. users
CREATE TABLE users (
    id              BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name       VARCHAR(120)          NOT NULL,
    email           VARCHAR(180)          NOT NULL,
    password_hash   VARCHAR(255)          NOT NULL,   -- BCrypt hash, never plain-text
    phone           VARCHAR(20)           NULL,
    avatar_url      VARCHAR(500)          NULL,       -- Cloudinary URL
    is_active       BOOLEAN               NOT NULL DEFAULT TRUE,
    created_at      DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- 1c. user_roles 
CREATE TABLE user_roles (
    user_id BIGINT  UNSIGNED NOT NULL,
    role_id TINYINT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT
);

-- =============================================================================
-- 2. PROPERTY MANAGEMENT
-- =============================================================================

-- 2a. property_types
CREATE TABLE property_types (
    id   TINYINT     UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(60) NOT NULL,          -- Apartment | Studio | Villa 
    PRIMARY KEY (id),
    CONSTRAINT uq_property_types_name UNIQUE (name)
);

-- 2b. properties
CREATE TABLE properties (
    id               BIGINT          UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_id         BIGINT          UNSIGNED NOT NULL,
    property_type_id TINYINT         UNSIGNED NOT NULL,
    title            VARCHAR(200)             NOT NULL,
    description      TEXT                     NULL,
    price_per_month  DECIMAL(12, 2)           NOT NULL,
    city             VARCHAR(100)             NOT NULL,
    district         VARCHAR(100)             NULL,
    address          VARCHAR(300)             NULL,
    latitude         DECIMAL(9, 6)            NULL,
    longitude        DECIMAL(9, 6)            NULL,
    num_rooms        TINYINT         UNSIGNED NULL,
    area_sqm         DECIMAL(8, 2)            NULL,
    is_available     BOOLEAN                  NOT NULL DEFAULT TRUE,
    created_at       DATETIME                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME                 NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_properties_owner      FOREIGN KEY (owner_id)         REFERENCES users          (id) ON DELETE CASCADE,
    CONSTRAINT fk_properties_type       FOREIGN KEY (property_type_id) REFERENCES property_types (id) ON DELETE RESTRICT,
    -- Performance: Search & filter indexes
    INDEX idx_properties_owner          (owner_id),
    INDEX idx_properties_city           (city),
    INDEX idx_properties_price          (price_per_month),
    INDEX idx_properties_type           (property_type_id),
    INDEX idx_properties_available      (is_available),
    INDEX idx_properties_location       (city, district)
);

-- 2c. property_images  (one property → many images)
CREATE TABLE property_images (
    id           BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
    property_id  BIGINT       UNSIGNED NOT NULL,
    image_url    VARCHAR(500)          NOT NULL,   -- Cloudinary secure URL
    is_cover     BOOLEAN               NOT NULL DEFAULT FALSE,
    display_order TINYINT     UNSIGNED NOT NULL DEFAULT 0,
    uploaded_at  DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_property_images_property FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE,
    INDEX idx_property_images_property (property_id)
);

-- =============================================================================
-- 3. FAVORITES
-- =============================================================================

CREATE TABLE favorites (
    tenant_id   BIGINT   UNSIGNED NOT NULL,
    property_id BIGINT   UNSIGNED NOT NULL,
    saved_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, property_id),
    CONSTRAINT fk_favorites_tenant   FOREIGN KEY (tenant_id)   REFERENCES users      (id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_property FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE,
    INDEX idx_favorites_property (property_id)
);

-- =============================================================================
-- 4. RENTAL REQUESTS
-- =============================================================================

CREATE TABLE rental_requests (
    id              BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
    property_id     BIGINT       UNSIGNED NOT NULL,
    tenant_id       BIGINT       UNSIGNED NOT NULL,
    message         TEXT                  NULL,
    desired_start   DATE                  NOT NULL,
    desired_months  TINYINT      UNSIGNED NOT NULL DEFAULT 1,
    status          ENUM(
                        'PENDING',
                        'ACCEPTED',
                        'REJECTED',
                        'CANCELLED'
                    )                     NOT NULL DEFAULT 'PENDING',
    reviewed_at     DATETIME              NULL,
    created_at      DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_rental_requests_property FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE,
    CONSTRAINT fk_rental_requests_tenant   FOREIGN KEY (tenant_id)   REFERENCES users      (id) ON DELETE CASCADE,
    INDEX idx_rental_requests_property (property_id),
    INDEX idx_rental_requests_tenant   (tenant_id),
    INDEX idx_rental_requests_status   (status)
);

-- =============================================================================
-- 5. IJARA CONTRACT SYSTEM
-- =============================================================================

-- 5a. contract_statuses  (lookup table)
CREATE TABLE contract_statuses (
    id   TINYINT     UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL,           -- PENDING | ACTIVE | COMPLETED | CANCELLED
    PRIMARY KEY (id),
    CONSTRAINT uq_contract_statuses_name UNIQUE (name)
);

-- 5b. contracts  (auto-created on request approval)
CREATE TABLE contracts (
    id                 BIGINT         UNSIGNED NOT NULL AUTO_INCREMENT,
    rental_request_id  BIGINT         UNSIGNED NOT NULL,
    property_id        BIGINT         UNSIGNED NOT NULL,
    owner_id           BIGINT         UNSIGNED NOT NULL,
    tenant_id          BIGINT         UNSIGNED NOT NULL,
    contract_status_id TINYINT        UNSIGNED NOT NULL,
    rent_amount        DECIMAL(12, 2)          NOT NULL,
    duration_months    TINYINT        UNSIGNED NOT NULL,
    start_date         DATE                    NOT NULL,
    end_date           DATE                    NOT NULL,
    pdf_url            VARCHAR(500)            NULL,      -- optional PDF export
    notes              TEXT                    NULL,
    created_at         DATETIME                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME                NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_contracts_request  UNIQUE (rental_request_id),           -- 1-to-1 with request
    CONSTRAINT fk_contracts_request  FOREIGN KEY (rental_request_id)  REFERENCES rental_requests  (id) ON DELETE RESTRICT,
    CONSTRAINT fk_contracts_property FOREIGN KEY (property_id)         REFERENCES properties       (id) ON DELETE RESTRICT,
    CONSTRAINT fk_contracts_owner    FOREIGN KEY (owner_id)            REFERENCES users            (id) ON DELETE RESTRICT,
    CONSTRAINT fk_contracts_tenant   FOREIGN KEY (tenant_id)           REFERENCES users            (id) ON DELETE RESTRICT,
    CONSTRAINT fk_contracts_status   FOREIGN KEY (contract_status_id)  REFERENCES contract_statuses(id) ON DELETE RESTRICT,
    CONSTRAINT chk_contracts_dates   CHECK (end_date > start_date),
    INDEX idx_contracts_owner    (owner_id),
    INDEX idx_contracts_tenant   (tenant_id),
    INDEX idx_contracts_property (property_id),
    INDEX idx_contracts_status   (contract_status_id)
);

-- =============================================================================
-- 6. PAYMENT TRACKING
-- =============================================================================

-- 6a. payment_statuses  (lookup table)
CREATE TABLE payment_statuses (
    id   TINYINT     UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL,           -- PENDING | PAID | OVERDUE | WAIVED
    PRIMARY KEY (id),
    CONSTRAINT uq_payment_statuses_name UNIQUE (name)
);

-- 6b. payments  (one row per monthly installment)
CREATE TABLE payments (
    id                BIGINT         UNSIGNED NOT NULL AUTO_INCREMENT,
    contract_id       BIGINT         UNSIGNED NOT NULL,
    payment_status_id TINYINT        UNSIGNED NOT NULL,
    installment_no    TINYINT        UNSIGNED NOT NULL,   -- 1 … duration_months
    due_date          DATE                    NOT NULL,
    paid_date         DATETIME                NULL,
    amount_due        DECIMAL(12, 2)          NOT NULL,
    amount_paid       DECIMAL(12, 2)          NOT NULL DEFAULT 0.00,
    transaction_ref   VARCHAR(100)            NULL,
    notes             TEXT                    NULL,
    created_at        DATETIME                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME                NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_payments_contract_installment UNIQUE (contract_id, installment_no),
    CONSTRAINT fk_payments_contract FOREIGN KEY (contract_id)       REFERENCES contracts       (id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_status   FOREIGN KEY (payment_status_id) REFERENCES payment_statuses(id) ON DELETE RESTRICT,
    INDEX idx_payments_contract  (contract_id),
    INDEX idx_payments_due_date  (due_date),
    INDEX idx_payments_status    (payment_status_id)
);

-- =============================================================================
-- 7. NOTIFICATIONS
-- =============================================================================

-- 7a. notification_types  (lookup table)
CREATE TABLE notification_types (
    id   TINYINT     UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,           -- NEW_REQUEST | REQUEST_ACCEPTED | REQUEST_REJECTED | PAYMENT_REMINDER | …
    PRIMARY KEY (id),
    CONSTRAINT uq_notification_types_name UNIQUE (name)
);

-- 7b. notifications
CREATE TABLE notifications (
    id                   BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
    recipient_id         BIGINT       UNSIGNED NOT NULL,
    notification_type_id TINYINT      UNSIGNED NOT NULL,
    title                VARCHAR(200)          NOT NULL,
    body                 TEXT                  NULL,
    reference_id         BIGINT       UNSIGNED NULL,     -- generic FK: request_id / contract_id / payment_id
    reference_type       VARCHAR(50)           NULL,     -- 'rental_request' | 'contract' | 'payment'
    is_read              BOOLEAN               NOT NULL DEFAULT FALSE,
    created_at           DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id)         REFERENCES users              (id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_type      FOREIGN KEY (notification_type_id) REFERENCES notification_types (id) ON DELETE RESTRICT,
    INDEX idx_notifications_recipient (recipient_id),
    INDEX idx_notifications_read      (recipient_id, is_read),
    INDEX idx_notifications_type      (notification_type_id)
);

-- =============================================================================
-- 8. NEWS SECTION
-- =============================================================================

-- 8a. article_categories  (lookup table)
CREATE TABLE article_categories (
    id          TINYINT     UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(80) NOT NULL,   -- Market | Investment | Housing | …
    slug        VARCHAR(80) NOT NULL,
    description VARCHAR(255) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_article_categories_name UNIQUE (name),
    CONSTRAINT uq_article_categories_slug UNIQUE (slug)
);

-- 8b. articles
CREATE TABLE articles (
    id          BIGINT       UNSIGNED NOT NULL AUTO_INCREMENT,
    category_id TINYINT      UNSIGNED NOT NULL,
    author_id   BIGINT       UNSIGNED NULL,   -- NULL = system/external
    title       VARCHAR(300)          NOT NULL,
    slug        VARCHAR(300)          NOT NULL,
    summary     VARCHAR(500)          NULL,
    body        LONGTEXT              NOT NULL,
    cover_url   VARCHAR(500)          NULL,
    is_published BOOLEAN              NOT NULL DEFAULT FALSE,
    published_at DATETIME             NULL,
    created_at  DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_articles_slug        UNIQUE (slug),
    CONSTRAINT fk_articles_category    FOREIGN KEY (category_id) REFERENCES article_categories (id) ON DELETE RESTRICT,
    CONSTRAINT fk_articles_author      FOREIGN KEY (author_id)   REFERENCES users              (id) ON DELETE SET NULL,
    INDEX idx_articles_category    (category_id),
    INDEX idx_articles_published   (is_published, published_at),
    FULLTEXT INDEX ft_articles_search  (title, summary, body)
);

-- 8c. saved_articles  (junction: tenant saves articles)
CREATE TABLE saved_articles (
    user_id    BIGINT   UNSIGNED NOT NULL,
    article_id BIGINT   UNSIGNED NOT NULL,
    saved_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, article_id),
    CONSTRAINT fk_saved_articles_user    FOREIGN KEY (user_id)    REFERENCES users    (id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_articles_article FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
    INDEX idx_saved_articles_article (article_id)
);

-- =============================================================================
-- 9. SEED DATA – Lookup Tables
-- =============================================================================

INSERT INTO roles (name, description) VALUES
    ('OWNER',  'Property owner who lists and manages properties'),
    ('TENANT', 'Tenant who searches and rents properties'),
    ('ADMIN',  'Platform administrator');

INSERT INTO property_types (name) VALUES
    ('Apartment'),
    ('Studio'),
    ('Villa'),
    ('Duplex'),
    ('Office'),
    ('Shop'),
    ('Warehouse');

INSERT INTO contract_statuses (name) VALUES
    ('PENDING'),
    ('ACTIVE'),
    ('COMPLETED'),
    ('CANCELLED');

INSERT INTO payment_statuses (name) VALUES
    ('PENDING'),
    ('PAID'),
    ('OVERDUE'),
    ('WAIVED');

INSERT INTO notification_types (name) VALUES
    ('NEW_REQUEST'),
    ('REQUEST_ACCEPTED'),
    ('REQUEST_REJECTED'),
    ('REQUEST_CANCELLED'),
    ('CONTRACT_CREATED'),
    ('CONTRACT_COMPLETED'),
    ('PAYMENT_REMINDER'),
    ('PAYMENT_RECEIVED');

INSERT INTO article_categories (name, slug, description) VALUES
    ('Market',     'market',     'Real estate market trends and analysis'),
    ('Investment', 'investment', 'Investment tips and strategies'),
    ('Housing',    'housing',    'Housing news and government updates'),
    ('Legal',      'legal',      'Rental laws and tenant rights');
