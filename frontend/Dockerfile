# ─────────────────────────────────────────────────────────────────────────────
# Daily Health Tracker -- Frontend Dockerfile
# Multi-stage build: Node.js for compiling the Vite + React app, then Nginx
# Alpine for serving the static assets in production.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (separate from source copy for better layer caching)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application source
COPY . .

# Build the production bundle
RUN npm run build

# ── Stage 2: Serve with Nginx ───────────────────────────────────────────────
FROM nginx:alpine

# Copy built static assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (API proxy, SPA fallback, SSE support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (mapped in docker-compose)
EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
