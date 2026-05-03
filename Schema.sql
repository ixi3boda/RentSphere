SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS contracts;
DROP TABLE IF EXISTS rental_requests;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS property_images;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- users
CREATE TABLE users (
    user_id         INT       UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name       VARCHAR(120)          NOT NULL,
    email           VARCHAR(180)          NOT NULL,
    username        VARCHAR(200)          NOT NULL,
    role_name       VARCHAR(50)           NOT NULL,
    password_hash   VARCHAR(255)          NOT NULL,   -- BCrypt hash, never plain-text
    mobile_number   VARCHAR(20)           NULL,
    avatar_url      VARCHAR(500)          NULL,       -- Cloudinary URL
    is_active       BOOLEAN               NOT NULL DEFAULT TRUE,
    created_at      DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_role_name CHECK (role_name IN ('TENANT', 'ADMIN', 'VISITOR')),
);

-- properties
CREATE TABLE properties (
    property_id      INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_id         INT          UNSIGNED NOT NULL,
    property_type    VARCHAR(200) NOT NULL,
    title            VARCHAR(200) NOT NULL,
    property_description VARCHAR(200) NULL,
    price_per_month  DECIMAL(12, 2)  NOT NULL,
    city             VARCHAR(100)    NOT NULL,
    district         VARCHAR(100)    NULL,
    address          VARCHAR(300)    NOT NULL,
    latitude         DECIMAL(9, 6)   NULL,
    longitude        DECIMAL(9, 6)   NULL,
    num_rooms        INT             UNSIGNED NOT NULL,
    area_sqm         DECIMAL(8, 2)   NOT NULL,
    is_available     BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (property_id),
    CONSTRAINT chk_type CHECK (property_type IN ('APARTMENT', 'STUDIO', 'VILLA', 'DUPLEX','OFFICE','SHOP','WAREHOUSE')),
    CONSTRAINT fk_properties_owner      FOREIGN KEY (owner_id)         REFERENCES users (user_id) ON DELETE CASCADE,
    -- Performance: Search & filter indexes
    INDEX idx_properties_owner          (owner_id),
    INDEX idx_properties_city           (city),
    INDEX idx_properties_price          (price_per_month),
    INDEX idx_properties_available      (is_available),
    INDEX idx_properties_location       (city, district)
);

-- property_images  (one property → many images)
CREATE TABLE property_images (
    property_img_id  INT       UNSIGNED NOT NULL AUTO_INCREMENT,
    property_id  INT       UNSIGNED NOT NULL,
    image_url    VARCHAR(500)          NOT NULL,   -- Cloudinary secure URL
    is_cover     BOOLEAN               NOT NULL DEFAULT FALSE,
    uploaded_at  DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (property_img_id),
    CONSTRAINT fk_property_images_property FOREIGN KEY (property_id) REFERENCES properties (property_id) ON DELETE CASCADE,
    INDEX idx_property_images_property (property_id)
);


CREATE TABLE favorites (
    tenant_id   INT   UNSIGNED NOT NULL,
    property_id INT   UNSIGNED NOT NULL,
    saved_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, property_id),
    CONSTRAINT fk_favorites_tenant   FOREIGN KEY (tenant_id)   REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_property FOREIGN KEY (property_id) REFERENCES properties (property_id) ON DELETE CASCADE,
    INDEX idx_favorites_property (property_id)
);

CREATE TABLE rental_requests (
    rental_req_id   INT       UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_id     INT       UNSIGNED NOT NULL,
    tenant_id       INT       UNSIGNED NOT NULL,
    message         VARCHAR(200)          NULL,
    desired_start   DATE                  NOT NULL,
    desired_months  INT      UNSIGNED NOT NULL DEFAULT 1,
    req_status      VARCHAR(50)           NOT NULL DEFAULT 'PENDING',
    reviewed_at     DATETIME              NULL,
    created_at      DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_status CHECK (req_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT fk_rental_requests_property FOREIGN KEY (property_id) REFERENCES properties (property_id) ON DELETE CASCADE,
    CONSTRAINT fk_rental_requests_tenant   FOREIGN KEY (tenant_id)   REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_rental_requests_property (property_id),
    INDEX idx_rental_requests_tenant   (tenant_id),
    INDEX idx_rental_requests_status   (req_status)
);

-- contracts  (auto-created on request approval)
CREATE TABLE contracts (
	contract_id        INT         UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rental_request_id  INT         UNSIGNED NOT NULL,
    property_id        INT         UNSIGNED NOT NULL,
    owner_id           INT         UNSIGNED NOT NULL,
    tenant_id          INT         UNSIGNED NOT NULL,
    contract_status    VARCHAR(20) NOT NULL,
    rent_amount        DECIMAL(12, 2)          NOT NULL,
    duration_months    INT         UNSIGNED NOT NULL,
    start_date         DATE                    NOT NULL,
    end_date           DATE                    NOT NULL,
    pdf_url            VARCHAR(500)            NULL,      -- optional PDF export
    notes              VARCHAR(200)            NULL,
    created_at         DATETIME                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME                NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_contract_status CHECK (contract_status IN ('PENDING','ACTIVE','COMPLETED','CANCELLED')),
    CONSTRAINT uq_contracts_request  UNIQUE (rental_request_id),           -- 1-to-1 with request
    CONSTRAINT fk_contracts_request  FOREIGN KEY (rental_request_id)  REFERENCES rental_requests  (rental_req_id) ON DELETE RESTRICT,
    CONSTRAINT fk_contracts_property FOREIGN KEY (property_id)         REFERENCES properties (property_id) ON DELETE RESTRICT,
    CONSTRAINT fk_contracts_owner    FOREIGN KEY (owner_id)            REFERENCES users (user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_contracts_tenant   FOREIGN KEY (tenant_id)           REFERENCES users (user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_contracts_dates   CHECK (end_date > start_date),
    INDEX idx_contracts_owner    (owner_id),
    INDEX idx_contracts_tenant   (tenant_id),
    INDEX idx_contracts_property (property_id)
);

-- payments  (one row per monthly installment)
CREATE TABLE payments (
    payment_id        INT         UNSIGNED NOT NULL AUTO_INCREMENT,
    contract_id       INT         UNSIGNED NOT NULL,
    payment_status    VARCHAR(20)    NOT NULL,
    installment_no    INT        UNSIGNED NOT NULL,   -- 1 … duration_months
    due_date          DATE                    NOT NULL,
    paid_date         DATETIME                NOT NULL,
    amount_due        DECIMAL(12, 2)          NOT NULL,
    amount_paid       DECIMAL(12, 2)          NOT NULL DEFAULT 0.00,
    transaction_ref   VARCHAR(100)            NULL,
    notes             VARCHAR(200)            NULL,
    created_at        DATETIME                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME                NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'OVERDUE', 'WAIVED')),
    CONSTRAINT uq_payments_contract_installment UNIQUE (contract_id, installment_no),
    CONSTRAINT fk_payments_contract FOREIGN KEY (contract_id) REFERENCES contracts (contract_id) ON DELETE CASCADE,
    INDEX idx_payments_contract  (contract_id),
    INDEX idx_payments_due_date  (due_date)
);

-- notifications
CREATE TABLE notifications (
    noti_id              INT       UNSIGNED NOT NULL AUTO_INCREMENT,
    recipient_id         INT       UNSIGNED NOT NULL,
    notification_type    VARCHAR(50)  NOT NULL,
    title                VARCHAR(200)          NOT NULL,
    body                 VARCHAR(200)          NULL,
    is_read              BOOLEAN               NOT NULL DEFAULT FALSE,
    created_at           DATETIME              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (noti_id),
    CONSTRAINT chk_noti_type CHECK (notification_type IN ('NEW_REQUEST','REQUEST_ACCEPTED','REQUEST_REJECTED','REQUEST_CANCELLED','CONTRACT_CREATED','CONTRACT_COMPLETED','PAYMENT_REMINDER','PAYMENT_RECEIVED')),
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id)  REFERENCES users  (user_id) ON DELETE CASCADE,
    INDEX idx_notifications_recipient (recipient_id),
    INDEX idx_notifications_read      (recipient_id, is_read)
);


