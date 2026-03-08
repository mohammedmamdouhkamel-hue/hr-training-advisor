# ──────────────────────────────────────────────
# Express API proxy for Anthropic  (~180 MB image)
# ──────────────────────────────────────────────
FROM node:20-alpine

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install dependencies
COPY docker/backend/package.json docker/backend/package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application code
COPY docker/backend/server.js ./

# Switch to non-root user
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "server.js"]
