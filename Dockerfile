# ─── Medal Tracker — Cloud Run Container ─────────────────
FROM node:22-slim

WORKDIR /app

# Copy package files and install deps
COPY package.json package-lock.json* ./
RUN npm ci --production 2>/dev/null || npm install --production

# Copy application code
COPY server.js ./
COPY public/ ./public/

# Cloud Run provides PORT env var
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:8080/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
