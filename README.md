# RentSphere — Property Rental Platform

A full-stack property rental platform connecting **landlords** and **tenants** with an end-to-end workflow for listing, filtering, booking, automated contract scheduling, and payment settlement.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-rentsphere--5jpa.onrender.com-0284c7?style=for-the-badge&logo=render)](https://rentsphere-5jpa.onrender.com)
[![OpenAPI / Swagger](https://img.shields.io/badge/OpenAPI%203.0-Swagger%20UI-10b981?style=for-the-badge&logo=swagger)](https://rentsphere-api.onrender.com/swagger-ui/index.html)
[![Backend Tests](https://img.shields.io/badge/Backend%20Tests-207%20Passed-brightgreen?style=for-the-badge&logo=junit5)](Backend/)
[![Frontend Tests](https://img.shields.io/badge/Frontend%20Tests-67%20Passed-brightgreen?style=for-the-badge&logo=jest)](Frontend/)
[![Code Coverage](https://img.shields.io/badge/Coverage-JaCoCo%20%3E70%25-success?style=for-the-badge)](Backend/target/site/jacoco/index.html)

> **Core Stack:** Java 17 · Spring Boot 3.4.3 · Spring JDBC (`JdbcTemplate`) · MySQL 8.0 · React.js · Tailwind CSS · Nginx · Docker Compose

---

## Try it

**Live demo: <https://rentsphere-5jpa.onrender.com>** — log in with one of the demo accounts
below. It runs on free tiers (Render + Aiven MySQL), so the API sleeps after 15 idle minutes
and the first request after a pause takes about a minute; after that it is fast.

| Resource | Live | Local (Docker) |
|---|---|---|
| Web application | <https://rentsphere-5jpa.onrender.com> | `http://localhost` |
| Swagger UI | <https://rentsphere-api.onrender.com/swagger-ui/index.html> | `http://localhost:8080/swagger-ui/index.html` |
| OpenAPI 3.0 spec | <https://rentsphere-api.onrender.com/v3/api-docs> | `http://localhost:8080/v3/api-docs` |
| Actuator health | <https://rentsphere-api.onrender.com/actuator/health> | `http://localhost:8080/actuator/health` |

It was first deployed on AWS EC2 ([runbook below](#aws-ec2-deployment-with-github-actions-cd));
the live instance moved to free tiers when that account's free period ended. To run it yourself,
`docker compose up --build` and load the sample data ([Getting Started](#getting-started)).

### Demo accounts
Created by [`Database/seed-demo.sql`](Database/seed-demo.sql); all share the password
`RentSphereDemo2026` (public on purpose — it only exists in a database seeded from that file).

| Role | Email | What it shows |
|---|---|---|
| Owner (`ADMIN`) | `nour.elsayed@nilenest.demo` | Admin console, nine listings, incoming request queue, lease management |
| Tenant | `youssef.farouk@mail.demo` | An active lease with paid and pending instalments, saved listings, one pending and one rejected request |
| Tenant | `salma.abdelnabi@mail.demo` | An active lease, two pending requests |

The full list is in [`docs/SAMPLE-DATA.md`](docs/SAMPLE-DATA.md).

---

## 💡 Why I Built This & Engineering Takeaways

Most full-stack tutorials stop at simple CRUD with high-level ORM abstractions that hide query execution costs. I built RentSphere to dive deep into production-grade backend engineering: eliminating query amplification under load, architecting normalized relational schemas with strict data integrity, building stateless JWT security with RBAC, implementing distributed correlation tracing, and tuning database performance with real Apache JMeter load tests.

### Key Engineering Takeaways:
1. **Eliminating N+1 Query Cascades (80× Latency Drop):**
   - *Problem:* Fetching property cards alongside multiple images initially triggered separate image lookups per listing — resulting in over **28,500 queries** during free-text browse benchmarks.
   - *Solution:* Replaced single-record loops with chunked batch hydration (`WHERE property_id IN (...)` in [`PropertyRepository.java`](Backend/src/main/java/com/example/RentSphere/Repository/PropertyRepository.java)), reducing database round trips to constant time and slashing browse latency from **1,808 ms to 22 ms**.
2. **Paging the search path, then indexing it:**
   - *Problem:* The free-text search returned every match (14,286 rows for `office`) and cost **8,036 ms** per request at 50 users.
   - *Solution:* `LIMIT ? OFFSET ?` with a capped page size brought the measured mean to **82 ms**. The remaining cost was an unanchored `LIKE '%term%'`, which `EXPLAIN` showed as a full scan, so the query now uses `MATCH(...) AGAINST(... IN BOOLEAN MODE)` over a `FULLTEXT` index in [`Database/Schema.sql`](Database/Schema.sql), with a `LIKE` fallback for the H2 test database. The full-text change has not been load-tested yet, so the 82 ms figure is the paging result only.
3. **Centralized exception handling:**
   - A single [`GlobalExceptionHandler`](Backend/src/main/java/com/example/RentSphere/Exception/GlobalExceptionHandler.java) (`@RestControllerAdvice`) returns one [`ErrorResponse`](Backend/src/main/java/com/example/RentSphere/Dto/ErrorResponse.java) JSON shape across all 31 endpoints. Internal SQL exceptions, class names, and stack traces are suppressed from callers and safely logged at WARN/ERROR.
4. **End-to-End Request Tracing (MDC Correlation IDs):**
   - [`MdcLoggingFilter`](Backend/src/main/java/com/example/RentSphere/SecurityConfig/MdcLoggingFilter.java) runs at `HIGHEST_PRECEDENCE` and stamps every inbound HTTP request with a unique `X-Correlation-ID` header into SLF4J MDC. Coupled with Logstash JSON logging ([`logback-spring.xml`](Backend/src/main/resources/logback-spring.xml)), logs can be aggregated in ELK, Datadog, or CloudWatch with single-query trace reconstruction.
5. **Edge Rate Limiting with Nginx:**
   - Configured an Nginx reverse-proxy edge with token-bucket rate limiting (`10 r/s` with a burst of `20 nodelay`) on `/api/` to absorb burst traffic, protect authentication endpoints from credential-stuffing, and defend database connection pools against exhaustion.

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
| DevOps     | Docker, Docker Compose, Nginx, GitHub Actions; AWS EC2 and Render deployment paths |
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
├── deploy/setup-ec2.sh         # EC2 provisioning script
├── render.yaml                 # Free-tier deployment blueprint (Render + Aiven MySQL)
└── docker-compose.yml          # Full stack orchestration
```

---

## Getting Started

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

## Free-tier deployment (Render + Aiven MySQL)

How the live demo is hosted, at zero cost. Aiven needs no card; Render asks for one to verify
the account but the services below stay on its free plan.

| Piece | Where | Notes |
|---|---|---|
| Spring Boot API | Render free web service, built from [`Backend/Dockerfile`](Backend/Dockerfile) | 512 MB / 0.1 CPU; sleeps after 15 idle minutes, so the first request after a pause takes about a minute |
| React build | Render static site | Calls the API through `REACT_APP_API_URL`; CORS is opened for that one origin |
| MySQL 8 | Aiven free plan | Real MySQL, so the `FULLTEXT` index and `CHECK` constraints behave as they do locally |

The Nginx edge and its rate limit are part of the Compose and EC2 topology only; this path
trades them for a free host.

1. **Database.** Create a free MySQL service at [aiven.io](https://aiven.io), then load the
   schema and sample data with the host, port and `avnadmin` password from its overview page:

   ```bash
   docker run --rm -i mysql:8.0 mysql -h <HOST> -P <PORT> -u avnadmin -p<PASSWORD> \
     --ssl-mode=REQUIRED defaultdb < Database/Schema.sql
   docker run --rm -i mysql:8.0 mysql -h <HOST> -P <PORT> -u avnadmin -p<PASSWORD> \
     --ssl-mode=REQUIRED defaultdb < Database/seed-demo.sql
   ```

2. **Services.** In Render choose **New → Blueprint**, pick this repository, and fill in the
   values [`render.yaml`](render.yaml) asks for (or create the web service and the static site
   by hand with the same settings):

   | Variable | Value |
   |---|---|
   | `SPRING_DATASOURCE_URL` | `jdbc:mysql://<HOST>:<PORT>/defaultdb?sslMode=REQUIRED` |
   | `SPRING_DATASOURCE_USERNAME` / `_PASSWORD` | `avnadmin` and its password |
   | `PAYPAL_CLIENT_ID` / `_SECRET` | PayPal sandbox app credentials |

3. **URLs.** If Render had to add a suffix to either service name, update
   `REACT_APP_API_URL` on the static site and `RENTSPHERE_CORS_ALLOWED_ORIGINS` on the API to
   the real URLs and redeploy both.

---

## AWS EC2 deployment (with GitHub Actions CD)

The single-host topology: the whole Compose stack on one EC2 instance, redeployed over SSH by
the `deploy-to-ec2` job in [`ci.yml`](.github/workflows/ci.yml). The job is a no-op until the
three repository secrets in step 3 exist.

### Architecture on AWS
- **Host:** AWS EC2 instance running Ubuntu 24.04 / 22.04 LTS (e.g., `t3.small` or `t2.micro` free tier).
- **Edge Proxy:** Nginx edge container listening on port `80`, routing `/api/`, `/actuator/`, and `/swagger-ui/` to Spring Boot (`:8080`), and all other requests to the nginx container serving the React build (`:3000`).
- **Database:** MySQL 8.0 container on an internal Docker bridge network with data persisted to a Docker volume.
- **CI/CD:** GitHub Actions triggers on every push to `main` — running 207 backend JUnit tests, 67 React Jest tests, Docker build verification, and automated SSH deployment to EC2.

---

### Step 1: Launch an AWS EC2 Instance

1. In the **AWS Management Console**, navigate to **EC2** → **Launch Instance**.
2. **Name:** `RentSphere-Production`
3. **OS Image (AMI):** Ubuntu Server 24.04 LTS or 22.04 LTS (64-bit x86).
4. **Instance Type:** `t3.small` (2 vCPU, 2GB RAM — recommended) or `t2.micro` (1 vCPU, 1GB RAM — free tier eligible).
5. **Key Pair:** Select or create a new key pair (e.g. `rentsphere-ec2.pem`). Download and keep this file safe.
6. **Network Settings (Security Group):**
   - Allow **SSH** (Port 22) from your IP or `0.0.0.0/0`.
   - Allow **HTTP** (Port 80) from `0.0.0.0/0`.
   - Allow **HTTPS** (Port 443) from `0.0.0.0/0`.
7. **Storage:** 20 GiB gp3.
8. Click **Launch Instance**.

---

### Step 2: One-Command Automated Provisioning

Once your instance is running, connect via SSH from your local machine:

```bash
chmod 400 rentsphere-ec2.pem
ssh -i rentsphere-ec2.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

Run the automated provisioning script:

```bash
curl -sSL https://raw.githubusercontent.com/ixi3boda/RentSphere/main/deploy/setup-ec2.sh | bash
```

**What the script does automatically:**
- Sets up a **2GB swapfile** if RAM < 3GB (prevents out-of-memory errors on `t2.micro` during container builds).
- Installs Docker CE, Docker Compose plugin, and Git.
- Configures the UFW firewall (ports 22, 80, 443).
- Clones `RentSphere`, creates a production `.env` with strong random secrets (`openssl rand -hex 32`).
- Builds and starts the Docker Compose stack.
- Waits for the MySQL health check and loads [`Database/seed-demo.sql`](Database/seed-demo.sql).

The application is then served at `http://<YOUR-EC2-PUBLIC-IP>/`.

---

### Step 3: Setup Automated Continuous Deployment (GitHub Actions)

To automatically deploy new code whenever you push to `main`:

1. On GitHub, go to your repository: **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** and add the following 3 secrets:

| Secret Name | Value | Example |
|---|---|---|
| `EC2_HOST` | Your EC2 instance public IPv4 address or Elastic IP | `54.210.123.45` |
| `EC2_USER` | The default SSH username for your AMI | `ubuntu` |
| `EC2_SSH_KEY` | Entire content of your `.pem` private key file | `-----BEGIN RSA PRIVATE KEY----- ...` |

3. Push any commit to `main`. The [`deploy-to-ec2`](.github/workflows/ci.yml) workflow will automatically build, test, and deploy the update to your live EC2 instance with zero manual intervention.

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

## 📡 API Architecture & OpenAPI Documentation

RentSphere exposes **31 REST operations over 30 paths**, structured with strict DTO separation and Spring Security method-level authorization.

- **Interactive Swagger UI:** [`http://localhost:8080/swagger-ui/index.html`](http://localhost:8080/swagger-ui/index.html) *(or via edge proxy at `/swagger-ui/index.html`)*
- **OpenAPI 3.0 Raw JSON Spec:** [`http://localhost:8080/v3/api-docs`](http://localhost:8080/v3/api-docs)

> **Testing Protected Endpoints in Swagger UI:**
> 1. Call `POST /api/user/login` with `{"email": "nour.elsayed@nilenest.demo", "password_hash": "RentSphereDemo2026"}`.
> 2. Copy the `token` string from the JSON response.
> 3. Click the **Authorize 🔓** button at the top right of Swagger UI, paste the token into the value field, and click **Authorize**. All subsequent requests will automatically include the `Authorization: Bearer <token>` header.

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
4. **Full-text index (added after the run above, not yet re-measured).** With paging in place
   the search still ran an unanchored `LIKE '%term%'`, which `EXPLAIN` reports as a full scan of
   ~98,821 rows plus a filesort. It now runs `MATCH(...) AGAINST(? IN BOOLEAN MODE)` over
   `FULLTEXT idx_properties_fulltext (title, city, district, property_description)`, with a
   dialect check so the H2 tests keep using `LIKE`. The table above predates this change.

Reproduce it in about ten minutes with the runbook in
[`Performance/README.md`](Performance/README.md).

---

## 🛡️ Edge Rate Limiting & Nginx Architecture

RentSphere deploys an Nginx reverse proxy edge container ([`Nginx/nginx.conf`](Nginx/nginx.conf)) sitting in front of both the Spring Boot API and the React SPA.

### Rate Limiting Strategy
To protect the backend database connection pools and mitigate denial-of-service or brute-force credential attacks, Nginx enforces a leaky/token-bucket rate-limiting zone on all API routes:

```nginx
# Zone allocated with 10MB of state (~160,000 unique IP tracking addresses)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://backend_service;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

- **Sustained rate:** `10 requests/second` per IP address.
- **Burst capacity:** Up to `20 requests` processed with `nodelay` to gracefully absorb legitimate UI spikes (e.g. concurrent dashboard card fetches).
- **Security Headers:** Every response is stamped with `X-Frame-Options SAMEORIGIN`, `X-Content-Type-Options nosniff`, `X-XSS-Protection "1; mode=block"`, and `Referrer-Policy no-referrer-when-downgrade`.

---

## ⚠️ Centralized Exception Handling & Standard Error Schema

All exceptions thrown across controllers, services, repositories, or Spring Security filters are intercepted by [`GlobalExceptionHandler`](Backend/src/main/java/com/example/RentSphere/Exception/GlobalExceptionHandler.java) (`@RestControllerAdvice`).

### Standardized RFC-Compliant Error Response
Clients receive a uniform, predictable JSON error contract ([`ErrorResponse`](Backend/src/main/java/com/example/RentSphere/Dto/ErrorResponse.java)):

```json
{
  "message": "Validation failed for input fields",
  "status": 400,
  "error": "Bad Request",
  "timestamp": "2026-10-01T14:30:00",
  "errors": {
    "pricePerMonth": "must be greater than 0",
    "propertyType": "propertyType cannot be blank"
  }
}
```

### Exception Mapping Hierarchy
| Exception Class | HTTP Status | Response Description | Security / Operational Behavior |
|---|---|---|---|
| `MethodArgumentNotValidException` | `400 Bad Request` | Validation failed for input fields | Extracts all field-level constraint violations into the `errors` map |
| `BadRequestException` | `400 Bad Request` | Semantic validation message | Raised when business invariants are violated |
| `PaymentProcessingException` | `400 Bad Request` | Payment gateway error | Handles PayPal failures or amount mismatches |
| `IllegalArgumentException` | `400 Bad Request` | Argument error message | Service-level guard validation |
| `MethodArgumentTypeMismatchException` | `400 Bad Request` | `Invalid value for '<param>'` | Catches malformed path variables (e.g. `/api/properties/abc`) |
| `DataIntegrityViolationException` | `400 Bad Request` | `The request conflicts with a data constraint` | Logs raw SQL constraint error at `WARN`; suppresses DB internals from caller |
| `HttpMessageNotReadableException` | `400 Bad Request` | `Request body could not be read` | Suppresses Jackson internals and deserialization details |
| `UnauthorizedAccessException`, `IllegalStateException` | `401 Unauthorized` | Caller authentication required | Unauthenticated or missing principal |
| `AccessDeniedException` | `403 Forbidden` | `Access denied: <reason>` | Caller lacks the necessary role (e.g. `VISITOR` calling owner endpoints) |
| `ResourceNotFoundException`, `NoResourceFoundException` | `404 Not Found` | Entity / endpoint not found | Returned when an ID or route does not exist |
| `DuplicateResourceException` | `409 Conflict` | Conflict description | Returned when an email or unique constraint already exists |
| `HttpRequestMethodNotSupportedException` | `405 Method Not Allowed` | `Unsupported method for this endpoint` | HTTP verb mismatch on an existing path |
| `Exception` (catch-all) | `500 Internal Server Error` | `An unexpected server error occurred` | Logs full stack trace at `ERROR`; zero internal details leaked |

---

## 📊 Structured Logging & Observability (MDC & Actuator)

Production observability requires single-pane distributed request correlation and machine-readable log streams.

1. **MDC Correlation IDs (`X-Correlation-ID`):**
   - [`MdcLoggingFilter`](Backend/src/main/java/com/example/RentSphere/SecurityConfig/MdcLoggingFilter.java) executes at `Ordered.HIGHEST_PRECEDENCE` on every request.
   - If an upstream gateway (Nginx / API Gateway) provides an `X-Correlation-ID`, it is preserved; otherwise, a new `UUID` is generated.
   - The ID is stored in SLF4J `MDC` under `correlationId` and echoed back in the response headers.
   - The `finally` block guarantees `MDC.remove()` cleanup, preventing ID pollution across thread-pool reuse.

2. **Structured JSON Logging:**
   - [`logback-spring.xml`](Backend/src/main/resources/logback-spring.xml) configures Logstash Logback Encoder (`net.logstash.logback.encoder.LogstashEncoder`).
   - In production profile (`spring.profiles.active=prod`), logs are output as single-line JSON objects with ISO-8601 timestamps, severity, logger name, thread, and top-level `correlationId`, ready for direct ingestion by ELK, Datadog, Grafana Loki, or AWS CloudWatch.

3. **Spring Boot Actuator Health & Metrics:**
   - Active health check at [`/actuator/health`](http://localhost:8080/actuator/health) (validating DB connectivity and disk space).
   - Application metrics available at [`/actuator/metrics`](http://localhost:8080/actuator/metrics).

---

## 📚 Backend Javadoc Documentation

Every backend module is documented with Java Standard Edition compliant Javadocs, explaining architectural responsibilities, method preconditions, lifecycle flows, and database constraint couplings.

- **Controllers:** Endpoint HTTP mappings, query parameter rules, role authorization levels, and response semantics.
- **Services:** Lifecycle transitions (e.g., rental request approval generating monthly instalment schedules), payment verification guards, and notification deduplication.
- **Repositories:** SQL queries, parameterized statements, batching strategies (`buildPropertyDetailsBatch`), and pagination clauses.
- **Security & Filters:** Stateless JWT lifecycle, CORS policy headers, MDC request tracing, and exception interceptors.

### Generate the Javadoc Site:
```bash
cd Backend
./mvnw javadoc:javadoc
# Open target/reports/apidocs/index.html in your browser
```

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
