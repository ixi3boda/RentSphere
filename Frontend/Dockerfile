# Build the static bundle
FROM node:25-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve it with nginx; no Node process or dev server in the running image. The unprivileged
# variant runs as the nginx user (uid 101) and keeps its pid and temp files under /tmp.
FROM nginxinc/nginx-unprivileged:1.30-alpine

# Pick up Alpine security fixes released since the base image was published
USER root
RUN apk upgrade --no-cache
USER 101

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/ || exit 1
