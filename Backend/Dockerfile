# ---- Build stage: JDK + Maven, thrown away after the build ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Cache dependencies separately so this layer is reused on src-only changes
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn -B clean package -DskipTests \
 && cp target/*.jar app.jar \
 && java -Djarmode=tools -jar app.jar extract --layers --launcher --destination extracted

# ---- Runtime stage: JRE only, no Maven, no source code ----
FROM eclipse-temurin:25-jre-jammy
WORKDIR /app

# Pick up Ubuntu security fixes released since the base image was published
RUN apt-get update && apt-get upgrade -y --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Run as an unprivileged user; Kubernetes can then enforce runAsNonRoot
RUN groupadd --system --gid 10001 app \
 && useradd --system --uid 10001 --gid app --no-create-home --shell /usr/sbin/nologin app

# Spring Boot layers, least to most frequently changed. A code-only change rebuilds just the
# last layer, so pushes and pulls move a few hundred KB instead of the whole fat jar.
COPY --from=build /build/extracted/dependencies/ ./
COPY --from=build /build/extracted/spring-boot-loader/ ./
COPY --from=build /build/extracted/snapshot-dependencies/ ./
COPY --from=build /build/extracted/application/ ./

USER 10001:10001

# Size the heap from the container memory limit, not the host's RAM. A platform can override
# this by setting JAVA_TOOL_OPTIONS itself (render.yaml does).
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${SERVER_PORT:-8080}/actuator/health" || exit 1

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
