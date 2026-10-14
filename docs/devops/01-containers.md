# Step 1 — Production-ready containers and an image registry

Branch `devops/01-containers` · roadmap: [../devops-roadmap.md](../devops-roadmap.md)

## The concepts

**Image vs. container.** An image is a read-only template: a stack of filesystem layers plus
metadata (user, entrypoint, env). A container is a running process started from an image, with
a thin writable layer on top. Same image, many containers.

**Layers and the build cache.** Each `COPY`/`RUN` instruction makes a layer. Docker reuses a
layer if its instruction and inputs haven't changed, and once one layer changes, every layer
after it is rebuilt. So the rule is to **order from least to most frequently changed**. That's
why `pom.xml` is copied and dependencies downloaded *before* `src/`. Editing Java code doesn't
re-download 150 MB of Maven dependencies.

**Multi-stage builds.** The first stage has the JDK and Maven, which you need for building. The
final stage has only the JRE and the app, which is all you need at runtime. Build tools in a
runtime image are extra size and extra attack surface.

**Spring Boot layered jars.** A fat jar is one 60 MB file, so changing one line ships all 60 MB
again. `java -Djarmode=tools -jar app.jar extract --layers` splits it into `dependencies`,
`spring-boot-loader`, `snapshot-dependencies` and `application`. Each becomes its own image
layer. A code change now produces a new ~800 KB layer, and the registry and every server
already hold the rest.

**Non-root containers.** By default a container runs as uid 0. If someone breaks out of the
app (an RCE bug, for example), root inside the container makes escaping to the host and
tampering with the filesystem much easier. We create user `10001` and switch to it with `USER`.
In Step 3 Kubernetes will *enforce* this with `runAsNonRoot: true`, and a root image would be
refused. The frontend uses `nginx-unprivileged`, which runs as uid 101 and listens on a port
above 1024. Unprivileged users can't bind ports below 1024.

**`.dockerignore`.** The build context is everything Docker sends to the builder. Without
`.dockerignore`, `target/`, `.env` files and IDE folders go along. That makes builds slower,
breaks the cache, and risks **baking secrets into an image**.

**HEALTHCHECK.** Docker runs this command periodically and marks the container `healthy` or
`unhealthy`. It's the Docker-level version of the liveness/readiness probes you'll write in
Kubernetes. Kubernetes ignores `HEALTHCHECK` and uses its own probes. Compose and
`docker ps` use it.

**JVM in containers.** Old JVMs sized the heap from the *host's* RAM and got OOM-killed.
`-XX:MaxRAMPercentage=75` means 75 % of the *container's* memory limit, leaving room for
metaspace, threads and off-heap memory. It's set via `JAVA_TOOL_OPTIONS`, so a platform can
override it. Render does, with 65 % on its 512 MB box.

**Container registry.** A registry stores images, like GitHub for images. We use **GHCR**
(`ghcr.io`), which is free and authenticates with the workflow's own `GITHUB_TOKEN`, so there's
no extra secret to store.

**Tags vs. digests, and "build once, deploy many".** `latest` is a *moving* label. `sha-3ddaea1`
names the image built from that commit. A digest (`@sha256:…`) is the exact content hash and
never changes. Production deploys reference the commit tag or digest, so you always know what's
running and rolling back means "run the previous tag". The image that passed CI is the same
image that runs in prod. Nothing is rebuilt on the server. The old EC2 deploy ran
`docker compose build` on the server, which breaks that rule. Step 5 replaces it.

**Spring profiles.** `application-prod.properties` only applies when the `prod` profile is
active. It was never activated, so production silently ran dev logging. Now
`SPRING_PROFILES_ACTIVE=prod` is set in Compose and Render, and the logs are JSON. Step 7 needs
JSON logs so Loki can parse fields like `level` and `correlationId`. The prod file now holds
**only the differences** from the base config, which removes the drift: the `PORT` vs.
`SERVER_PORT` mismatch and the leftover JPA settings.

## What changed

| File | Change |
|---|---|
| `Backend/Dockerfile` | Layered jar, non-root uid 10001, `HEALTHCHECK`, container-aware heap |
| `Backend/.dockerignore` | New: only `pom.xml` and `src/` reach the builder |
| `Frontend/Dockerfile` | `nginx-unprivileged` (uid 101), `HEALTHCHECK` |
| `application-prod.properties` | Only the prod overrides; port and datasource come from the base file |
| `docker-compose.yml`, `render.yaml` | `SPRING_PROFILES_ACTIVE=prod` |
| `.github/workflows/ci.yml` | `docker-images` matrix job: builds both images after the tests pass, pushes to GHCR on `main` with `sha-<commit>` and `latest` tags and a GitHub Actions layer cache. `compose-config` validates the Compose file |
| Removed | `Backend/Dockerfile.test`, `Backend/docker-compose.test.yml`, `Database/Dockerfile` (unused) |

## Try it yourself

```bash
docker build -t rentsphere-backend Backend
docker run --rm --entrypoint id rentsphere-backend          # uid=10001(app), not root
docker history rentsphere-backend                            # the application layer is ~800 KB
docker compose up -d && docker compose ps                    # every service shows (healthy)
docker logs rentsphere-backend | tail -1                     # one JSON object per line
```

Then change one line of Java, rebuild, and watch only the last steps re-run.

After the first push to `main`, open **GitHub → your profile → Packages**. The two packages
start **private**. Set them to public (Package settings → Change visibility) so Kubernetes can
pull them without a pull secret in Step 3.

## Interview questions this step answers

- Why multi-stage builds? → smaller images, no build tools in prod, smaller attack surface
- How do you make Docker builds fast? → layer ordering, `.dockerignore`, cache in CI (`type=gha`)
- Why not run as root? → limits the damage of a container breakout; required by Kubernetes Pod Security
- Why not deploy `latest`? → it moves; you can't tell what's running or roll back reliably
- How does the JVM know its memory limit in a container? → container support plus `MaxRAMPercentage`
- What is "build once, deploy many"? → the tested artifact is promoted unchanged through environments
