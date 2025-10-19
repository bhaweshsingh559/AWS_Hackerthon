# Backend Dockerfile (multi-stage)
# Builds smaller image and runs as non-root user
FROM node:20-alpine AS builder
WORKDIR /app

# Install build deps (if your backend needs build step). Use package-lock if present
COPY package*.json ./
RUN npm ci --production --silent

# Copy source
COPY . .

# If you have a build step (e.g. Babel/TS) run it here. If not, skip.
# RUN npm run build

# Final runtime image
FROM node:20-alpine AS runtime
WORKDIR /app

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Copy only production node_modules and source
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

ENV NODE_ENV=production
ENV PORT=3002

# Expose port
EXPOSE 3002

# Healthcheck (simple)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- --timeout=2 http://localhost:${PORT}/health || exit 1

USER appuser
# Use script from package.json: "start": "node src/index.js" or adjust accordingly
CMD ["npm", "run", "start"]