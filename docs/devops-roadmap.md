# RentSphere DevOps Roadmap

Goal: turn RentSphere from "an app with a Dockerfile and a CI file" into a project that shows
the full DevOps lifecycle: build → ship → provision → run → observe → recover. Every step is
its own branch, its own PR and its own merge, so the git history tells the story.

Hard rule for the whole roadmap: **$0 spent.** Every cloud step says what it costs and how it
stays inside free credits.

---

## Where the project stands today (review, 2026-10-14)

Already solid (keep it, and mention it in interviews):

- Multi-stage Dockerfiles for the backend and the frontend, plus Docker Compose with a MySQL health check
- CI on GitHub Actions: 230 backend tests with JaCoCo, 67 frontend tests, and a Compose build
- Actuator health check, correlation IDs in the MDC, Logstash JSON encoder
- App-level rate limiting, security headers, CSP, least-privilege roles
- A JMeter load test with recorded before/after numbers (very useful once monitoring exists)

Gaps found in the review. Some of these block the later steps:

| # | Finding | Why it matters |
|---|---|---|
| 1 | `SPRING_PROFILES_ACTIVE` is never set in `render.yaml`, `docker-compose.yml` or `deploy/setup-ec2.sh` | `application-prod.properties` and the JSON logs in `logback-spring.xml` **never run in production**. Log shipping (Loki) needs them |
| 2 | Both images run as **root**, and `Backend/` has no `.dockerignore` | Kubernetes security contexts (`runAsNonRoot`) will reject the image. Scanners will flag it |
| 3 | Images are built in CI but **never pushed** to a registry, and the EC2 deploy runs `docker compose build` on the server | Kubernetes pulls images and does not build them. You need versioned images (`:sha`) to roll back |
| 4 | `Database/Schema.sql` starts with `DROP TABLE` and there is no migration tool | You can't safely change the schema of a running database. A pod restart must never wipe data |
| 5 | Two `@Scheduled` jobs (`ContractSchedulerService`, `DemoDataResetService`) and an in-memory `RateLimitFilter` | With 2+ replicas the daily jobs run twice (duplicate reminders, double resets) and the limits split per pod |
| 6 | Only `/actuator/health` exists, with no metrics endpoint and no liveness/readiness split | Prometheus has nothing to scrape. Kubernetes probes need `/actuator/health/liveness` and `/readiness` |
| 7 | CI deploy uses a long-lived SSH key, `StrictHostKeyChecking=no` and `git reset --hard` on the server | Not how production deploys are done. Use OIDC, immutable images and declarative rollouts |
| 8 | Stale files: `Backend/Dockerfile.test`, `Backend/docker-compose.test.yml` (uses the obsolete `version:` key), and the `Database/Dockerfile` that Compose doesn't use | Noise that reviewers notice |
| 9 | `application-prod.properties` reads `PORT` while the base config reads `SERVER_PORT`, and it carries JPA/Hibernate settings for an app that uses JdbcTemplate | Config drift. Pick one name |
| 10 | GitHub Actions are pinned by tag (`@v4`), and there's no Dependabot and no secret/image/IaC scanning | Supply-chain hygiene, which is expected at production level |

---

## The free-AWS strategy (read this before Step 4)

Facts that shape the design:

- Your old AWS account's free tier is used up, so anything you run there is **billed**. Don't use it.
- AWS accounts created since July 2025 choose a **Free plan** with $100 in credits, plus up to $100
  more for onboarding tasks. A Free-plan account **can't be charged**. When the credits or the
  6 months run out, it stops instead of billing you. Some expensive services are restricted
  on that plan. Check the current list on the AWS Free Tier page when you sign up, and check
  whether you're eligible for a new account.
- **EKS isn't worth it here.** The control plane alone costs about $0.10/hour (≈ $73/month)
  and would use up the credits in under 3 months. It also needs load balancers and usually
  NAT gateways.

So the design is:

| Piece | Choice | Approx. cost on credits |
|---|---|---|
| Kubernetes (learning) | **kind** on your Mac | $0 |
| Kubernetes (cloud) | **k3s** (real, certified Kubernetes) on one EC2 `t3.small`, created by Terraform | ≈ $15/month |
| Network | VPC with **public subnets only**, **no NAT gateway**, **no ALB**. Traffic goes through the k3s Traefik ingress on the instance's public IP | ≈ $3.6/month (public IPv4) |
| Database | MySQL as a Kubernetes StatefulSet on EBS, with nightly `mysqldump` to S3. RDS is an optional Terraform flag (`enable_rds`) | EBS ≈ $2/month, S3 cents |
| Terraform state | S3 bucket with native lock file | cents |
| Container registry | **GHCR** (GitHub Container Registry) | $0 |
| Monitoring in cloud | **Grafana Cloud free tier**, fed by a small Grafana Alloy agent, so the 2 GB node doesn't have to run Prometheus | $0 |
| Guard rails | AWS Budget at $1 with email alerts, cost-allocation tags, `terraform destroy` when not demoing | $0 |

Roughly $20/month, which fits the credits for the 6-month window. Destroying the stack between
demos stretches it further. Render and Aiven stay as the always-on public demo, and AWS is the
"production-style" environment you show in interviews.

---

## How every step works

1. **Concept first.** Before any code, I explain what the tool is, what problem it solves, and
   the 5–10 terms you must know for interviews.
2. **Branch.** `git switch -c devops/NN-name`
3. **Build it together.** I write the code and explain each file. You run the commands
   yourself, so you learn what the output looks like when it works and when it fails.
4. **Verify.** Each step has a "done when" check you can demo.
5. **PR → review → merge** into `main`, with a clear description. One step = one PR.
6. **Study notes.** Each step adds a short section to `docs/devops/NN-name.md`: what you built,
   why, and the interview questions it answers.
7. **Tag a release** after big milestones (`v1.1.0`, …) so the history reads like a changelog.

---

## Step 1 — Production-ready containers + image registry

Branch `devops/01-containers`

**You learn:** image layers and caching, non-root containers, `.dockerignore`, image tags vs.
digests, container registries, why you build an image once and promote that same image.

**Build:**
- Backend Dockerfile: Spring Boot layered jar, non-root `USER`, `HEALTHCHECK`, JVM container
  flags (`MaxRAMPercentage`). Add a `.dockerignore`
- Frontend: run nginx unprivileged (`nginxinc/nginx-unprivileged`)
- Set `SPRING_PROFILES_ACTIVE=prod` in Compose and `render.yaml` (gap #1), and fix the `PORT`/`SERVER_PORT` drift (#9)
- Delete the stale `Dockerfile.test`, `docker-compose.test.yml` and `Database/Dockerfile` (#8)
- CI: build both images once and push them to **GHCR** tagged `:<git-sha>` and `:latest` on `main`

**Done when:** `docker run` shows a non-root user, the images are visible under your GitHub
Packages, and `docker compose up` still works.

## Step 2 — Database migrations with Flyway

Branch `devops/02-flyway`

**You learn:** schema migrations, versioned and repeatable scripts, why ops never runs SQL by hand,
rolling deploys and backward-compatible schema changes.

**Build:** add Flyway, turn `Schema.sql` into `V1__baseline.sql` (without the `DROP`s), let the
app migrate at startup, and keep H2 tests working (gap #4).

**Done when:** a fresh database and an existing database both start cleanly, and
`flyway_schema_history` shows V1.

## Step 3 — Kubernetes (locally with kind)

Branch `devops/03-kubernetes`

**You learn:** Pods, Deployments, ReplicaSets, Services, Ingress, ConfigMaps, Secrets,
StatefulSets and PersistentVolumeClaims, liveness/readiness/startup probes, resource
requests/limits, HPA, rolling updates and `kubectl rollout undo`, namespaces.

**Build:**
- App changes first: liveness/readiness health groups (#6), and **ShedLock** so the scheduled
  jobs run on only one pod (#5). The rate limiter is documented as per-pod, with the Ingress
  doing global limiting
- `k8s/` with **Kustomize**: `base/` (backend, frontend, MySQL StatefulSet, ingress) plus
  overlays `local/` and `aws/`
- Security context (`runAsNonRoot`, read-only root FS), a PodDisruptionBudget, an HPA on CPU
- A `Makefile` target that creates the kind cluster and deploys

**Done when:** the app runs at `http://rentsphere.localhost`, you can kill a pod and watch it
come back, and you can roll back a bad image with one command.

> Stretch: package the same thing as a **Helm chart** and explain Helm vs. Kustomize.

## Step 4 — Terraform: AWS infrastructure as code

Branch `devops/04-terraform`

**You learn:** providers, resources, variables/outputs, state and why it goes in remote S3 with
locking, `plan` vs. `apply`, modules, `terraform fmt/validate`, drift, `destroy`, tagging and
cost guard rails.

**Build** (in `infra/terraform/`):
- `bootstrap/`: S3 state bucket, plus an **AWS Budget alarm at $1** (the very first resource)
- `modules/network`: VPC, 2 public subnets, internet gateway, route tables, no NAT
- `modules/k3s-node`: `t3.small` with encrypted gp3 EBS, a security group (80/443 open, 6443
  only from your IP, **no SSH**: access goes through **SSM Session Manager**), and
  `user_data` that installs k3s
- `modules/github-oidc`: IAM OIDC provider plus a least-privilege role that GitHub Actions
  can assume, so **no AWS keys stored in GitHub**
- S3 bucket for DB backups with a lifecycle rule
- Optional `enable_rds` flag for RDS `db.t4g.micro`

**Done when:** `terraform apply` builds everything from zero in about 3 minutes,
`terraform destroy` removes all of it, and you can SSM into the box and see a k3s node.

## Step 5 — CI/CD to AWS (GitOps with Argo CD)

Branch `devops/05-cd`

**You learn:** CI vs. CD, push vs. pull deployment, GitOps, OIDC federation, GitHub
Environments with manual approval, promotion by image tag.

**Build:**
- Workflow `terraform.yml`: `fmt` + `validate` + `plan` posted as a PR comment, and `apply` on `main` behind an approval
- **Argo CD** in k3s watches `k8s/overlays/aws`. CI updates the image tag in git, and Argo CD
  syncs it. No SSH and no `git reset --hard` on servers (#7)
- Remove the old SSH EC2 deploy job and retire `deploy/setup-ec2.sh` (move it to a "history" note)
- TLS with **cert-manager + Let's Encrypt**, using a free domain (DuckDNS / sslip.io)

**Done when:** merging a PR changes the running version on AWS with no manual command, and
reverting the commit rolls it back.

## Step 6 — Monitoring with Prometheus + Grafana

Branch `devops/06-monitoring`

**You learn:** metrics vs. logs vs. traces, Prometheus pull model, PromQL, the RED and USE
methods, SLIs/SLOs/error budgets, alerting rules, dashboards as code.

**Build:**
- Spring Boot: Micrometer Prometheus registry, served on a **separate internal management
  port** so `/actuator/prometheus` is never public (this keeps your current security stance)
- Locally: **kube-prometheus-stack** (Prometheus, Grafana, Alertmanager) in kind
- Grafana dashboards committed as JSON and auto-provisioned: request rate, errors, p95 latency
  per endpoint, JVM heap/GC, Hikari pool, pod restarts
- Alert rules: 5xx rate > 2%, p95 > 500 ms, pod crash looping, disk > 80% → email/Discord
- AWS: Grafana Alloy → **Grafana Cloud free tier**, using the same dashboards
- **Proof:** rerun your JMeter plan against the cluster and screenshot the HPA scaling and the
  latency panel. That gives you a strong README section

**Done when:** you can open Grafana, start the load test, and watch the latency, replicas and
alerts react live.

## Step 7 — Centralized logs + tracing (Loki + OpenTelemetry)

Branch `devops/07-logs-tracing`

**You learn:** log aggregation, labels vs. full-text, LogQL, distributed tracing, spans, and
how to correlate a trace with its logs.

**Build:** ship the JSON logs (fixed in Step 1) to Loki, and add OpenTelemetry tracing
(Micrometer Tracing → Tempo / Grafana Cloud Traces). Use the trace ID as the correlation ID, so
in Grafana you can click from a slow request to its trace and its log lines.

**Done when:** from one slow request in Grafana you can reach its SQL span and log lines.

## Step 8 — DevSecOps: supply-chain and security scanning

Branch `devops/08-devsecops`

**You learn:** shift-left security, CVEs, SBOMs, secret scanning, IaC misconfiguration scanning,
least privilege across the pipeline.

**Build:**
- **Trivy** scanning of images and Terraform/K8s config in CI, failing on HIGH/CRITICAL
- **gitleaks** secret scanning, **Dependabot** for Maven, npm, Actions, Docker and Terraform
- Pin actions to commit SHAs (#10), generate an SBOM, and optionally sign images with **cosign**
- Secrets: **Sealed Secrets** or External Secrets + AWS SSM Parameter Store (free standard tier)
  so real secrets never sit in git or in plain K8s Secrets
- Branch protection on `main`: PR required, checks must pass

**Done when:** a PR that adds a vulnerable dependency or a fake key goes red.

## Step 9 — Reliability: backups, DR and runbooks

Branch `devops/09-reliability`

**You learn:** RPO/RTO, backup vs. restore testing, disaster recovery, runbooks, postmortems.

**Build:** a K8s CronJob that runs a nightly `mysqldump` → S3, a scripted restore that is
**actually tested**, and `docs/runbooks/` (app down, DB full, bad deploy, cost alarm). Run a
full DR drill: `terraform destroy`, then `apply`, then restore, and record how long it took.

**Done when:** you can rebuild production from nothing and quote your measured RTO.

## Step 10 — Final polish for recruiters

Branch `devops/10-docs`

Architecture diagram (code → CI → GHCR → Argo CD → k3s on AWS → Grafana), a README "DevOps"
section with screenshots of the dashboards, the pipeline and the Terraform plan, the
cost table, and a CV/LinkedIn bullet update. Tag `v2.0.0`.

---

## Order and dependencies

```
1 Containers ─┬─> 3 Kubernetes ─┬─> 5 CD/GitOps ─> 9 Reliability ─> 10 Docs
2 Flyway ─────┘                 │
4 Terraform ────────────────────┘
3 Kubernetes ─> 6 Monitoring ─> 7 Logs/Tracing
8 DevSecOps can slot in any time after 1
```

Steps 1–3 cost nothing and need no AWS account. Open the AWS Free-plan account right before
Step 4, so the 6-month clock starts as late as possible.
