# Load testing

JMeter plan, seed data and results for the listing read path.

## Setup

- 100k properties, 300k images, 5k users (`Database/seed-large-dataset.sql`)
- MySQL 8 + Spring Boot in Docker Compose, JMeter 5.6.3, all on one laptop (Apple M5)
- 5 samplers that match what the React app actually calls: `/properties/stats`,
  `/properties/filter`, `/properties/filter?search=`, `/properties/{id}` and `/user/me` with a JWT
- 1-2 s random think time, 10 s ramp, 60 s per run

Because the load generator, the app and the DB share one machine, absolute numbers move
10-30% between runs. Before and after were measured back to back on the same data.

## Results (2026-10-01, 0 errors in every run)

| Run | Users | Avg | p95 | Throughput |
|---|---:|---:|---:|---:|
| before | 50 | 1,808 ms | 10,194 ms | 15 req/s |
| after | 50 | 22 ms | 84 ms | 31 req/s |
| after | 100 | 19 ms | 77 ms | 61 req/s |
| after | 200 | 25 ms | 102 ms | 118 req/s |

Search alone went from 8,036 ms to 82 ms at 50 users. JSON transferred per 50-user run
dropped from 1.6 GB to 5.8 MB.

## What was wrong

1. **No paging.** `/properties/filter` returned every match. Searching "office" hit 14,286
   rows and sent back an 8 MB response. Adding `LIMIT ? OFFSET ?` (page size capped at 48)
   is where most of the gain came from.
2. **N+1 on images.** Each row ran its own `property_images` query, about 28,500 queries
   for one search request. `buildPropertyDetailsBatch` in `PropertyRepository` now loads
   images for up to 500 ids in a single `IN (...)` query. With paging in place this only
   saves ~2 ms per request, but it keeps the query count flat for `findByOwnerId`, which
   isn't paged.
3. **Unused indexes.** `EXPLAIN` on the real queries (`db-benchmark.sql`) showed 6 of 18
   indexes were never picked, so I dropped them.

After this run I replaced the `LIKE '%term%'` search (a full scan in `EXPLAIN`) with a
`FULLTEXT` index and `MATCH ... AGAINST`. That change hasn't been load tested yet, so the
numbers above don't include it.

## Run it

```bash
cp .env.example .env && set -a && source .env && set +a
# the API throttles each client IP, which a single-machine load test would hit at once
RENTSPHERE_RATELIMIT_ENABLED=false docker compose up -d mysql backend

# seed 100k listings (takes a few minutes)
docker compose exec -T mysql mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
  RentSphereSchema < Database/seed-large-dataset.sql

# register a throwaway user and grab a token for the /user/me sampler
curl -s -X POST localhost:8080/api/user/register -H 'Content-Type: application/json' \
  -d '{"email":"perf@test.local","username":"perf","full_name":"Perf","password_hash":"perf-pass-123","mobile_number":"01000000001"}'
TOKEN=$(curl -s -X POST localhost:8080/api/user/login -H 'Content-Type: application/json' \
  -d '{"email":"perf@test.local","password_hash":"perf-pass-123"}' | jq -r .token)

cd Performance   # the CSV files are resolved relative to this folder
for T in 50 100 200; do
  jmeter -n -t rentsphere-load-test.jmx -Jhost=localhost -Jport=8080 \
    -Jthreads=$T -Jramp=10 -Jduration=60 -Jtoken="$TOKEN" -JresultFile=run_$T.jtl
done
jmeter -g run_50.jtl -o reports/run_50   # HTML report
```

To get the "before" numbers, remove the `LIMIT ? OFFSET ?` from `filterProperties` and map
rows with `buildPropertyDetails` instead of the batch version.

## Files

- `rentsphere-load-test.jmx` - the test plan (threads, ramp, duration and token are `-J` props)
- `cities.csv`, `searchprefix.csv` - inputs so each iteration sends a different query
- `db-benchmark.sql` - index list and `EXPLAIN` for each query shape
- `docker-compose.perf.yml` - maps the backend to 8090 if 8080 is taken
- `proof/` - JMeter GUI screenshots and the session log from the 2026-10-01 runs

## Limits

- Single machine, so throughput is capped by the laptop, not the design.
- No caching on purpose, the point was to measure the DB cost per request.
- The browse query still sorts the full match set, so very deep pages are slower than the
  first few.
