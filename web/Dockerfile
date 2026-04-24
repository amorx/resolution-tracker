# syntax=docker/dockerfile:1.7
# STAGE 1: Build the Vite bundle
FROM node:20.18.1-alpine AS builder
WORKDIR /build
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund --ignore-scripts
COPY . .
RUN npm run build

# STAGE 2: Serve with nginx on an unprivileged port
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

LABEL org.opencontainers.image.source="resolution-tracker-web"

USER root
RUN apk upgrade --no-cache && \
    rm -rf /usr/share/nginx/html/* && \
    mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx
USER nginx

COPY --chown=nginx:nginx --from=builder /build/dist /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5173/ >/dev/null 2>&1 || exit 1
