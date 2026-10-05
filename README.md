# RentSphere

A rental platform where owners list properties and tenants browse, request a lease and pay
rent monthly. When an owner accepts a request, the backend creates the contract and its full
payment schedule in one transaction.

**Live demo:** https://rentsphere-5jpa.onrender.com
· **API docs (Swagger):** https://rentsphere-api.onrender.com/swagger-ui/index.html

It runs on Render's free plan, so the API sleeps when idle and the first request can take
about a minute. Log in with `nour.elsayed@nilenest.demo` (owner) or
`youssef.farouk@mail.demo` (tenant), password `RentSphereDemo2026`.

Java 17 · Spring Boot 3 · Spring Security · JdbcTemplate · MySQL 8 · React · Tailwind · Docker · Nginx · GitHub Actions

![Home page](docs/screenshots/01-home.jpg)

## Performance

I seeded 100k listings and 300k images and load-tested the read path with JMeter.

| | Before | After |
|---|---:|---:|
| Avg latency, 50 users | 1,808 ms | 22 ms |
| Search, 50 users | 8,036 ms | 82 ms |
| p95, 100 users | - | 77 ms |
| 200 concurrent users | - | 0% errors, ~120 req/s |

What I changed, all in `PropertyController` and `PropertyRepository`:

- **Paging.** The listing endpoint returned every match (one search sent back 14,286 rows,
  8 MB of JSON). It now uses `LIMIT/OFFSET` with the page size capped at 48.
- **N+1 fix.** Each row used to run its own image query, about 28,500 queries per search.
  Images for a page are now loaded in one batched `WHERE property_id IN (...)` query
  (`buildPropertyDetailsBatch`).
- **Indexes.** I ran `EXPLAIN` on every query the app sends (`Performance/db-benchmark.sql`)
  and dropped the 6 indexes nothing used, 18 → 12.
- **Full-text search.** `LIKE '%term%'` was a full table scan, so search now uses a `FULLTEXT`
  index with `MATCH ... AGAINST`, falling back to `LIKE` on H2 in tests. (Added after the run
  above, not load-tested yet.)

Test plan, seed script, raw results and JMeter screenshots: [Performance/](Performance/README.md)

## Security

- Stateless JWT auth with BCrypt-hashed passwords and 3 roles (`ADMIN`, `TENANT`, `VISITOR`)
- Role checks with `@PreAuthorize`, plus ownership checks in the service layer, so an owner
  can only accept or reject requests on their own listings
- All SQL is parameterized, and sort columns go through a whitelist instead of being
  concatenated into `ORDER BY`
- CORS only allows the configured frontend origin
- One `@RestControllerAdvice` returns the same JSON error shape everywhere and never sends
  SQL errors or stack traces to the client
- Nginx in front rate-limits `/api/` to 10 req/s per IP (burst 20) and adds security headers
  (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`)

## Data and transactions

- 8 MySQL tables with foreign keys and `CHECK` constraints on every status/type column
- `UNIQUE (contract_id, installment_no)` so the same instalment can't be paid twice
- Accepting a request is one `@Transactional` call that creates the contract and one payment
  row per month. Card and PayPal payments are transactional too
- A `@Scheduled` daily job sends reminders 3 days and 1 day before a due date, marks late
  instalments overdue and cancels contracts that stay unpaid

## Observability and docs

- Each request gets an `X-Correlation-ID`, stored in the logging MDC and returned in the
  response header
- JSON logs (Logstash encoder) in the `prod` profile
- Spring Boot Actuator health check, which Render uses to check the deploy
- OpenAPI 3 / Swagger UI for all 31 endpoints
- Javadoc on the controllers, services, repositories and security classes
  (`cd Backend && ./mvnw javadoc:javadoc`)

## Deployment

- **Live:** Spring Boot runs as a Docker web service on Render, the React build is a Render
  static site, and the database is MySQL on Aiven. Everything is defined in
  [`render.yaml`](render.yaml), including JVM flags for the 512 MB instance
  (`MaxRAMPercentage`, `SerialGC`) and a smaller Hikari pool
- **Local:** Docker Compose runs MySQL (with a health check), the API, the frontend and the
  Nginx proxy. Backend and frontend images are multi-stage builds
- **AWS EC2 (first deploy):** before Render, the whole Compose stack ran on an EC2 instance.
  `deploy/setup-ec2.sh` sets up a fresh Ubuntu server (Docker, swap, firewall, generated
  secrets) and starts it, and the CI pipeline has an SSH deploy job for it. I moved to Render
  when the AWS free tier ran out

## Tests and CI

- 207 backend tests (JUnit 5, Mockito, MockMvc, H2) with a JaCoCo coverage report (~70% lines)
- 67 frontend tests (Jest, React Testing Library, jest-axe)
- GitHub Actions runs both suites and builds the Docker images on every push

```bash
cd Backend && ./mvnw test
cd Frontend && CI=true npm test
```

## Features

**Tenants** search by city, district, type and price, save favourites, send rental requests,
and pay instalments by card or PayPal (sandbox). They get notified when a request is reviewed
or a payment goes through.

**Owners** manage listings and photos, accept or reject requests, and track leases and
outstanding payments from an admin dashboard.

| | |
|---|---|
| ![Listings](docs/screenshots/02-listings.jpg) | ![Listing detail](docs/screenshots/03-listing-detail.jpg) |
| ![Admin dashboard](docs/screenshots/04-admin-console.jpg) | ![Tenant dashboard](docs/screenshots/05-tenant-dashboard.jpg) |
| ![Rental requests](docs/screenshots/06-rental-requests.jpg) | ![Contracts and payments](docs/screenshots/07-contracts.jpg) |

## Run it locally

```bash
git clone https://github.com/ixi3boda/RentSphere.git
cd RentSphere
cp .env.example .env          # set the passwords and a JWT secret (32+ chars)
docker compose up --build
```

The app is at http://localhost (through Nginx), the API on `:8080`, MySQL on `:3306`.
The tables start empty. To load the demo data:

```bash
set -a; source .env; set +a
docker compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  RentSphereSchema < Database/seed-demo.sql
```

Use `Database/seed-large-dataset.sql` instead for the 100k-row load-test data.

### Deploy your own copy on Render

1. Create a free MySQL database on [Aiven](https://aiven.io) and load `Database/Schema.sql`
   and `Database/seed-demo.sql` into it.
2. In Render, choose **New → Blueprint** and pick this repo. Fill in the database URL,
   user and password, and the PayPal sandbox keys.
3. If Render changes the service names, update `REACT_APP_API_URL` and
   `RENTSPHERE_CORS_ALLOWED_ORIGINS` to the real URLs.

## Project layout

```
Backend/       Spring Boot API (Controller / Service / Repository / Dto / SecurityConfig)
Frontend/      React app
Database/      Schema.sql and seed scripts
Nginx/         reverse proxy config
Performance/   JMeter plan, EXPLAIN scripts, results
deploy/        VM setup script
render.yaml    Render deployment
```

## Author

Abdelrahman Essam · [LinkedIn](https://www.linkedin.com/in/abdelrahman-essam-a677a6328/) · [GitHub](https://github.com/ixi3boda)
