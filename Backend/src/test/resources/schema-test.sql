-- ─────────────────────────────────────────────────────────────────
-- H2-compatible schema for tests (mirrors MySQL production schema)
-- RentSphere test database DDL
-- ─────────────────────────────────────────────────────────────────
DROP ALL OBJECTS;

CREATE TABLE IF NOT EXISTS roles (
    role_id   INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    username      VARCHAR(100) NOT NULL UNIQUE,
    full_name     VARCHAR(255),
    mobile_number VARCHAR(20),
    avatar_url    VARCHAR(500),
    role_name     VARCHAR(50) NOT NULL DEFAULT 'VISITOR',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
    property_id         INT AUTO_INCREMENT PRIMARY KEY,
    owner_id            INT NOT NULL,
    property_type       VARCHAR(50) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    property_description TEXT,
    price_per_month     DECIMAL(10,2) NOT NULL,
    city                VARCHAR(100),
    district            VARCHAR(100),
    address             VARCHAR(255),
    latitude            DECIMAL(9,6),
    longitude           DECIMAL(9,6),
    num_rooms           INT,
    area_sqm            DECIMAL(10,2),
    is_available        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS property_images (
    image_id    INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    image_url   VARCHAR(500) NOT NULL,
    is_cover    BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id)
);

CREATE TABLE IF NOT EXISTS favorites (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id     INT NOT NULL,
    property_id INT NOT NULL,
    saved_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, property_id),
    FOREIGN KEY (tenant_id)     REFERENCES users(user_id),
    FOREIGN KEY (property_id) REFERENCES properties(property_id)
);

CREATE TABLE IF NOT EXISTS rental_requests (
    rental_req_id  INT AUTO_INCREMENT PRIMARY KEY,
    property_id    INT NOT NULL,
    tenant_id      INT NOT NULL,
    message        TEXT,
    desired_start  DATE,
    desired_months INT,
    req_status     VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_at    TIMESTAMP,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(property_id),
    FOREIGN KEY (tenant_id)   REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS contracts (
    contract_id       INT AUTO_INCREMENT PRIMARY KEY,
    rental_request_id INT NOT NULL,
    property_id       INT NOT NULL,
    owner_id          INT NOT NULL,
    tenant_id         INT NOT NULL,
    contract_status   VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
    rent_amount       DECIMAL(10,2) NOT NULL,
    duration_months   INT NOT NULL,
    start_date        DATE,
    end_date          DATE,
    pdf_url           VARCHAR(500),
    notes             TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rental_request_id) REFERENCES rental_requests(rental_req_id),
    FOREIGN KEY (property_id)       REFERENCES properties(property_id),
    FOREIGN KEY (owner_id)          REFERENCES users(user_id),
    FOREIGN KEY (tenant_id)         REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    contract_id     INT NOT NULL,
    payment_status  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    installment_no  INT NOT NULL,
    due_date        DATE NOT NULL,
    paid_date       TIMESTAMP,
    amount_due      DECIMAL(10,2) NOT NULL,
    amount_paid     DECIMAL(10,2) DEFAULT 0.00,
    transaction_ref VARCHAR(255),
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(contract_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
