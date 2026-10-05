# RentSphere

A rental platform where owners list properties and tenants browse, request a lease and pay
rent monthly. When an owner accepts a request, the backend creates the contract and its full
payment schedule in one transaction.

Spring Boot (JdbcTemplate, no ORM) · MySQL 8 · React + Tailwind · Docker Compose · Nginx · GitHub Actions

![Home page](docs/screenshots/01-home.jpg)

## What it does

**Tenants** search listings by city, district, type and price, save favourites, send rental
requests, and pay each monthly instalment by card or PayPal (sandbox). They get notified when
a request is accepted or rejected and when a payment goes through.

**Owners** manage their listings and photos, accept or reject requests, and track leases and
outstanding payments from an admin dashboard.

A scheduled job sends payment reminders 3 days and 1 day before a due date, marks late
instalments as overdue, and cancels contracts that stay unpaid.

## Backend

- 31 REST endpoints, documented with Swagger (`/swagger-ui/index.html`)
- JWT auth with BCrypt and 3 roles (`ADMIN`, `TENANT`, `VISITOR`). Ownership is also checked
  in the service layer, so an owner can only accept requests on their own listings
- 8 MySQL tables with foreign keys, `CHECK` constraints and a `UNIQUE (contract_id,
  installment_no)` so the same instalment can't be paid twice
- All SQL is hand-written with `JdbcTemplate`. Sort columns go through a whitelist, never
  string concatenation
- One `@RestControllerAdvice` returns the same error JSON for every endpoint and never leaks
  SQL or stack traces
- Every request gets an `X-Correlation-ID` (MDC), and logs are JSON in the `prod` profile
- Nginx in front with rate limiting on `/api/` (10 req/s per IP, burst 20)

## Performance

I seeded 100k listings and 300k images and load-tested the read path with JMeter.

| | Before | After |
|---|---:|---:|
| Avg latency, 50 users | 1,808 ms | 22 ms |
| Search, 50 users | 8,036 ms | 82 ms |
| p95, 100 users | - | 77 ms |
| 200 users | - | 0% errors, ~120 req/s |

The listing endpoint returned every match with no paging, and each row ran its own image
query (N+1). I added `LIMIT/OFFSET` and moved the images to one batched `IN (...)` query per
page. I also checked every index against `EXPLAIN` and dropped the 6 that were never used
(18 → 12). Full setup, raw results and JMeter screenshots are in [Performance/](Performance/README.md).

## Tests and CI

- 207 backend tests (JUnit 5, Mockito, MockMvc), about 70% line coverage with JaCoCo
- 67 frontend tests (Jest, React Testing Library, jest-axe)
- GitHub Actions runs both suites and builds the Docker images on every push. A deploy job
  ships `main` to an EC2 host over SSH when the `EC2_*` secrets are set

```bash
cd Backend && ./mvnw test
cd Frontend && CI=true npm test
```

## Run it locally

```bash
git clone https://github.com/ixi3boda/RentSphere.git
cd RentSphere
cp .env.example .env          # set the passwords and a JWT secret (32+ chars)
docker compose up --build
```

The app is at http://localhost (through Nginx). The API is on `:8080`, MySQL on `:3306`.

The schema is created on first start but the tables are empty. To load the demo data:

```bash
set -a; source .env; set +a
docker compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  RentSphereSchema < Database/seed-demo.sql
```

Demo logins (password `RentSphereDemo2026`, only exists in the seeded DB):

| Role | Email |
|---|---|
| Owner | `nour.elsayed@nilenest.demo` |
| Tenant | `youssef.farouk@mail.demo` |
| Tenant | `salma.abdelnabi@mail.demo` |

`Database/seed-large-dataset.sql` loads the 100k-row dataset used for load testing instead.

To deploy on a fresh Ubuntu EC2 instance, `deploy/setup-ec2.sh` installs Docker, generates
secrets, starts the stack and loads the demo data.

## Screenshots

| | |
|---|---|
| ![Listings](docs/screenshots/02-listings.jpg) | ![Listing detail](docs/screenshots/03-listing-detail.jpg) |
| ![Admin dashboard](docs/screenshots/04-admin-console.jpg) | ![Tenant dashboard](docs/screenshots/05-tenant-dashboard.jpg) |
| ![Rental requests](docs/screenshots/06-rental-requests.jpg) | ![Contracts and payments](docs/screenshots/07-contracts.jpg) |

## Project layout

```
Backend/       Spring Boot API (Controller / Service / Repository / Dto / SecurityConfig)
Frontend/      React app
Database/      Schema.sql and seed scripts
Nginx/         reverse proxy config
Performance/   JMeter plan, EXPLAIN scripts, results
deploy/        EC2 setup script
```

## Author

Abdelrahman Essam · [LinkedIn](https://www.linkedin.com/in/abdelrahman-essam-a677a6328/) · [GitHub](https://github.com/ixi3boda)
