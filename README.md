# RentSphere — Property Rental Platform

A full-stack property rental platform connecting **landlords** and **tenants** with a seamless experience for listing, browsing, booking, and managing rental properties.

> **Stack:** Spring Boot · React.js · MySQL · JWT · Docker Compose

---

##  Features

### For tenants
- Browse listings filtered by city, district, property type and maximum rent, with free-text search and pagination
- Save favourites, and submit a rental request with a desired start date and term
- Track each request through `PENDING` / `ACCEPTED` / `REJECTED` / `CANCELLED`
- Open the contract written on approval, see its month-by-month instalment schedule, and settle an instalment by card or PayPal
- Receive in-app notifications when a request is reviewed, a contract is created, or a payment lands

### For owners
- Create, update and remove listings, and attach photos to each with a cover image flagged
- Review incoming requests and accept or reject them — acceptance creates the contract and one instalment row per month in the same call
- Track leases and settled versus outstanding instalments from the admin console

### System
- JWT authentication with Spring Security RBAC over three roles: `ADMIN`, `TENANT`, `VISITOR`. Self-registration always yields `VISITOR`; promotion is an operator action, which is why the owner endpoints above sit behind `ADMIN`
- One-command Docker Compose deployment: MySQL 8, backend, frontend and an nginx edge
- Normalized schema with `CHECK` constraints and FK referential integrity across 8 tables
- 31 REST operations over 30 paths, DTO-separated, with `JdbcTemplate` repositories and batched reads

---

##  Interface

Every screenshot below is a real render of the running app against the sample dataset in
[`Database/seed-demo.sql`](Database/seed-demo.sql) — nine listings in Cairo, New Cairo, Sheikh
Zayed, Alexandria, Giza and Riyadh, three tenants, one owner, four leases and their instalments.
The data is hand-written to look like market activity, not the 100k synthetic rows the load
tests use. How to load it, the demo logins and the photo credits are in
[`docs/SAMPLE-DATA.md`](docs/SAMPLE-DATA.md).

### Home
The hero search and the counters come from `GET /api/properties/stats`, so "9 total · 5 available
· 4 active leases" is three live `COUNT(*)`s, not text.

![Home page with hero search and live listing counters](docs/screenshots/01-home.jpg)

### Browse
`GET /api/properties/filter` with city, type, price and search filters; each card is a 9-row page
and its photo comes from the batched image fetch.

![Browse page showing nine filtered listings with photos](docs/screenshots/02-listings.jpg)

### Listing detail
Full description, price, size and rooms, plus the photo carousel — this listing has three images.

![Listing detail page with photo carousel and pricing card](docs/screenshots/03-listing-detail.jpg)

### Admin console
The owner's inventory view: own listings, pending requests and active leases as separate queries,
so the three cards cannot drift apart.

![Admin console with my listings, pending requests and active leases](docs/screenshots/04-admin-console.jpg)

### Tenant dashboard
Saved listings, request history and active leases for the signed-in tenant.

![Tenant dashboard with favourites and lease summary](docs/screenshots/05-tenant-dashboard.jpg)

### Rental requests
The review queue. Accepting a request here is what creates the contract and its instalment rows.

![Rental request review queue with status counts](docs/screenshots/06-rental-requests.jpg)

### Contracts
A lease with its monthly instalment schedule and the pay action.

![Contract list with instalment schedule and pay action](docs/screenshots/07-contracts.jpg)

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Java 17, Spring Boot, Spring Security, Spring JDBC (`JdbcTemplate`) |
| Frontend   | React.js (Create React App), Tailwind CSS, Framer Motion |
| Database   | MySQL 8.0                           |
| Auth       | JWT (JSON Web Tokens)               |
| Payments   | PayPal REST + mock card settlement  |
| DevOps     | Docker, Docker Compose              |
| Performance | Apache JMeter 5.6.3, MySQL `EXPLAIN` |
| Build Tool | Maven                               |

---

##  Architecture

```
RentSphere/
├── Backend/                  # Spring Boot REST API
│   └── src/main/java/com/example/RentSphere/
│       ├── Controller/       # REST controllers
│       ├── Service/          # Business logic
│       ├── Repository/       # JdbcTemplate data access
│       ├── Dto/              # Request/response payloads and row records
│       ├── Exception/        # Domain exceptions + @RestControllerAdvice
│       └── SecurityConfig/   # JWT filter, Spring Security, CORS
├── Frontend/                 # React.js SPA
│   ├── src/                  # components / pages / services
│   ├── public/uploads/demo/  # listing photos used by the sample dataset
│   ├── scripts/              # contrast-audit.js (WCAG check against the live DOM)
│   └── Dockerfile
├── Database/
│   ├── Schema.sql              # tables, constraints, indexes
│   ├── seed-demo.sql           # 9-listing sample dataset behind the screenshots
│   └── seed-large-dataset.sql  # 100k listings / 300k images, for load testing
├── docs/
│   ├── SAMPLE-DATA.md          # how to load the demo data, logins, photo credits
│   └── screenshots/            # the UI captures above
├── Performance/                # JMeter plan, DB benchmarks, run proofs
│   ├── rentsphere-load-test.jmx
│   ├── db-benchmark.sql
│   └── proof/                  # JMeter GUI screenshots + session log
└── docker-compose.yml          # Full stack orchestration
```

---

##  Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- Git

### Run with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/ixi3boda/RentSphere.git
cd RentSphere

# Secrets: compose fails fast on ${VAR:?} without this
cp .env.example .env        # fill in real values

# Start the entire stack (database + backend + frontend + nginx)
docker compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8080 |
| Nginx    | http://localhost      |
| Database | localhost:3306        |

`Database/Schema.sql` is mounted into `/docker-entrypoint-initdb.d`, so a fresh volume comes up
with the tables already created. It is empty, so load something:

```bash
set -a; source .env; set +a

# the 9-listing sample dataset the screenshots above use
docker compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  RentSphereSchema < Database/seed-demo.sql

# or 100k listings / 300k images, for the load tests
docker compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  RentSphereSchema < Database/seed-large-dataset.sql
```

Either seed truncates the eight tables first, so both are safe to re-run. `seed-demo.sql` ships
with four accounts you can log in as — see [`docs/SAMPLE-DATA.md`](docs/SAMPLE-DATA.md).

### Stop the stack

```bash
docker compose down
```

To also remove persisted data:

```bash
docker compose down -v
```

---

##  Local Configuration

All credentials come from a gitignored `.env` at the repo root — nothing secret is committed, and
`application.properties` and `docker-compose.yml` only reference variables:

```bash
cp .env.example .env
```

`docker compose` reads `.env` automatically, and Spring Boot imports it through
`spring.config.import` when you run the backend directly with `mvn spring-boot:run`.

| Variable | Used for |
|----------|----------|
| `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` | MySQL container bootstrap |
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | JDBC connection (non-Docker runs) |
| `JWT_SECRET`, `JWT_EXPIRATION` | HMAC-SHA256 token signing (secret must be ≥ 32 chars) |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE` | PayPal sandbox/live credentials |
| `BACKEND_URL` | Where the dev-server proxy sends `/api` (defaults to `http://localhost:8080`) |

---

##  API Overview

31 operations over 30 paths. The full OpenAPI document is served at
[`/v3/api-docs`](http://localhost:8080/v3/api-docs) and browsable at
[`/swagger-ui/index.html`](http://localhost:8080/swagger-ui/index.html).

### Auth and profile

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST   | `/api/user/register` | Register (always creates a `VISITOR`) | Public |
| POST   | `/api/user/login`    | Login, returns a JWT | Public |
| GET    | `/api/user/me`       | Current profile | Authenticated |
| PUT    | `/api/user/me`       | Update profile | Authenticated |
| POST   | `/api/user/logout`   | Invalidate the session token | Authenticated |

### Properties

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/api/properties/filter` | Paged browse: city, district, type, max price, free-text search | Public |
| GET    | `/api/properties/stats`  | Total / available / leased counters | Authenticated |
| GET    | `/api/properties/cities` | Distinct cities for the filter dropdown | Authenticated |
| GET    | `/api/properties/{id}`   | Listing detail with photos | Public |
| GET    | `/api/properties/my`     | Listings owned by the caller | Authenticated |
| POST   | `/api/properties/add`    | Create a listing | ADMIN |
| PUT    | `/api/properties/{id}/update` | Update a listing | Owner |
| DELETE | `/api/properties/{id}/delete` | Delete a listing | Owner |
| POST   | `/api/properties/{id}/images/add` | Attach a photo | Owner |
| POST   | `/api/properties/{propertyId}/favorite` | Toggle a saved listing | Authenticated |
| GET    | `/api/properties/favorites/all` | My saved listings | Authenticated |

### Rentals, contracts and payments

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST   | `/api/rent/request` | Submit a rental request | Authenticated |
| GET    | `/api/rent/requests/{id}` | One request | Its requester, its property owner, or ADMIN |
| GET    | `/api/rent/requests/all` | Platform-wide request queue | ADMIN |
| GET    | `/api/rent/requests/summary` | Request counts by status | ADMIN |
| PUT    | `/api/rent/requests/{id}/accept` | Approve — writes the contract and one instalment row per month | Property owner |
| PUT    | `/api/rent/requests/{id}/reject` | Reject | Property owner |
| GET    | `/api/rent/contracts/all` | Contracts where I am the tenant or the owner | Authenticated |
| GET    | `/api/rent/contracts/manage` | All leases, owner view | ADMIN |
| GET    | `/api/rent/contracts/manage/summary` | Lease and instalment totals | ADMIN |
| GET    | `/api/rent/contracts/{contractId}/payments` | Instalment schedule | Tenant, owner, or ADMIN |
| POST   | `/api/rent/contracts/{contractId}/card-payment` | Settle an instalment by card | Tenant on an `ACTIVE` contract (or ADMIN) |
| POST   | `/api/rent/contracts/{contractId}/paypal` | Start a PayPal approval for an instalment | Tenant on an `ACTIVE` contract (or ADMIN) |
| POST   | `/api/rent/contracts/{contractId}/paypal/execute` | Capture after PayPal redirect | Tenant on an `ACTIVE` contract (or ADMIN) |

### Notifications

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET    | `/api/notifications/my` | My notifications | Authenticated |
| PUT    | `/api/notifications/{id}/read` | Mark one read | Recipient |

> Protected endpoints require `Authorization: Bearer <JWT_TOKEN>`. Ownership checks are enforced
> in the service layer, not just by role: accept/reject only works for the caller's own listings
> and only while the request is still `PENDING`.

---

##  Database Schema

Eight tables, all constraints in [`Database/Schema.sql`](Database/Schema.sql):

| Table | Key columns | Notes |
|---|---|---|
| `users` | `user_id`, `full_name`, `email` (unique), `username`, `role_name`, `password_hash`, `mobile_number`, `avatar_url`, `is_active` | `role_name` CHECK-constrained to `TENANT` / `ADMIN` / `VISITOR`; BCrypt hashes only |
| `properties` | `property_id`, `owner_id` → users, `property_type`, `title`, `property_description`, `price_per_month`, `city`, `district`, `address`, `latitude`/`longitude`, `num_rooms`, `area_sqm`, `is_available` | `property_type` CHECK-constrained to 7 types; FK to owner cascades |
| `property_images` | `property_img_id`, `property_id` → properties, `image_url`, `is_cover` | one listing → many photos, cascade on delete |
| `favorites` | (`tenant_id`, `property_id`) composite PK, `saved_at` | composite key makes re-saving idempotent |
| `rental_requests` | `rental_req_id`, `property_id`, `tenant_id`, `message`, `desired_start`, `desired_months`, `req_status`, `reviewed_at` | `req_status` ∈ `PENDING` / `ACCEPTED` / `REJECTED` / `CANCELLED` |
| `contracts` | `contract_id`, `rental_request_id` (unique), `property_id`, `owner_id`, `tenant_id`, `contract_status`, `rent_amount`, `duration_months`, `start_date`, `end_date`, `pdf_url`, `notes` | 1-to-1 with the approved request; `end_date > start_date` CHECK; FKs `RESTRICT` so a lease can't be orphaned |
| `payments` | `payment_id`, `contract_id`, `payment_status`, `installment_no`, `due_date`, `paid_date`, `amount_due`, `amount_paid`, `transaction_ref` | one row per contract month; `UNIQUE (contract_id, installment_no)` blocks double-paying an instalment |
| `notifications` | `noti_id`, `recipient_id`, `notification_type`, `title`, `body`, `is_read` | 8 typed events, all written by services rather than the client |

Indexes were chosen with `EXPLAIN` against the queries the app actually issues — see
[`Performance/db-benchmark.sql`](Performance/db-benchmark.sql).

---

## Performance work

The listing read path was benchmarked at scale instead of guessed at. Everything behind the
numbers — the test plan, the seed script, the raw session log and screenshots of the JMeter
GUI runs — is in [`Performance/`](Performance/README.md).

**Setup.** 100,000 properties, 300,000 images and 5,000 users seeded into MySQL 8 in Docker;
Apache JMeter 5.6.3 driving the five requests the React app actually makes (`/properties/stats`,
paged `/properties/filter`, its free-text search variant, `/properties/{id}`, and an
authenticated `/user/me`) with 1-2 s randomized think time, 60 s per step, ramp 10 s.

**What was measured** (2026-10-01, `__ALL__` rows, 0 errors in every run):

| | Before | After |
|---|---:|---:|
| Mean latency, 50 concurrent users | 1,808 ms | 22 ms |
| Free-text search sampler mean | 8,036 ms | 82 ms |
| JSON transferred per 50-user run | 1,626.9 MB | 5.8 MB |
| p95 at 100 concurrent users | — | 77 ms |
| Sustained load, 200 concurrent users | — | 0 % errors, ~120 req/s |
| Indexes on the schema | 18 | 12 |

"Before" is today's code with two lines put back, measured on the same machine three minutes
apart — not a stale baseline.

**What actually fixed it.**

1. **Paging.** `GET /api/properties/filter` returned every match: a search for `office` hit
   14,286 of 100,001 listings, so one browse request was 14,286 DTOs and an 8.2 MB JSON body.
   It
   now ends in `LIMIT ? OFFSET ?` with the page size capped at 48 in `PropertyController`. This is
   the 80x.
2. **N+1 removed.** Rows were mapped through a single-property builder that queried
   `property_images` per row — ~28,500 queries for the search sampler above.
   `buildPropertyDetailsBatch` in
   [`PropertyRepository.java`](Backend/src/main/java/com/example/RentSphere/Repository/PropertyRepository.java)
   now loads images for 500 ids at a time in one `WHERE property_id IN (...)`. Worth about 2 ms
   per request at the page sizes the UI uses; its real job is keeping the query count flat,
   which is what protects the un-paged `findByOwnerId`.
3. **Index prune.** `EXPLAIN` against the real query shapes showed 6 of 18 indexes were unused
   by the read path, so they were dropped — smaller write amplification, same reads.

The measurements are separated in [`Performance/README.md`](Performance/README.md), including the
run that isolates paging from batching. What is left is documented there too: the free-text
search is an unanchored `LIKE '%term%'`, which `EXPLAIN` reports as a full scan of ~98,821 rows
plus a filesort — no index fixes that, and the next step is a `FULLTEXT` index.

Reproduce it in about ten minutes with the runbook in
[`Performance/README.md`](Performance/README.md).

---

## Accessibility

The UI is a light product theme: white and slate surfaces, near-black text, one accent
(`sky-700`, the shade at which white button labels clear AA). Contrast is treated as a measured
property rather than an opinion, and the pages captured above are the pages the audit covers:

- [`Frontend/scripts/contrast-audit.js`](Frontend/scripts/contrast-audit.js) walks every text node
  in the live DOM, composites it through each ancestor background (including alpha and
  `bg-clip-text` gradients) and reports the worst WCAG 2.x ratio per node. Copy it into the
  running container and evaluate it in the page:
  `docker cp Frontend/scripts/contrast-audit.js rentsphere-frontend:/app/public/__audit.js`
- [`src/tests/a11y.test.jsx`](Frontend/src/tests/a11y.test.jsx) runs `jest-axe` over the shared
  components and the two data-heavy pages for structure (names, roles, heading order, landmarks).
  jsdom has no CSS cascade, so colour contrast is deliberately left to the browser audit above.

Current state, measured on all 12 routes under both an admin and a tenant session: 0 contrast
failures, no heading-level skips, no unnamed buttons, no images without `alt`. Entrance motion
honours `prefers-reduced-motion` through `MotionConfig`.

```bash
cd Frontend && CI=true npm test          # 67 tests, 9 suites
cd Backend  && ./mvnw test               # 207 tests
```

---

##  Development Setup (Without Docker)

### Backend

```bash
cd Backend
set -a; source ../.env; set +a    # application.properties imports .env itself
./mvnw spring-boot:run
```

### Frontend

```bash
cd Frontend
npm ci
npm start                # proxies /api to BACKEND_URL, default http://localhost:8080
```

> Ensure your local MySQL instance is running and the schema is initialized from
> `Database/Schema.sql`, then load one of the seeds as described above.

---

##  Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## Author

**Abdelrahman Essam**
- GitHub: [@ixi3boda](https://github.com/ixi3boda)
- LinkedIn: [ixi3boda](https://www.linkedin.com/in/ixi3boda)

---

## License

This project is public for review. No `LICENSE` file has been added, so no open-source licence
is granted yet.
