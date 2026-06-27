# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Build tools required by better-sqlite3 native addon
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies (separate layer → better layer caching)
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy application source after deps are installed
COPY backend/ .

# ── Stage 2: Production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Runtime C++ library required by better-sqlite3
RUN apk add --no-cache libstdc++

# Dedicated non-root user/group (UID/GID 1001)
RUN addgroup -g 1001 -S nodejs && \
    adduser  -u 1001 -S nodejs -G nodejs

WORKDIR /app

# Copy built app from builder stage, owned by non-root user
COPY --from=builder --chown=nodejs:nodejs /app ./

# Create data dir for SQLite DB — must be owned by nodejs before volume mounts
RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

USER nodejs

# Container-native health check using the existing /api/health endpoint
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

EXPOSE 3000
CMD ["node", "server.js"]
