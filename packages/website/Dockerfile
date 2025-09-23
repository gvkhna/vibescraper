FROM denoland/deno:bin AS deno
# ============================================
# Complete Development Environment
# ============================================
FROM node:lts AS build

WORKDIR /app

# Copy Deno binary for integration tests
COPY --from=deno /deno /usr/local/bin/deno

RUN corepack enable && npm install -g bun

# Copy lockfiles for dependency fetching
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

# Fetch all dependencies with cache
RUN pnpm fetch --frozen-lockfile

COPY . .

# Install dependencies offline (already fetched)
RUN pnpm install --recursive --offline --frozen-lockfile

# Build the application
RUN bun run typecheck && \
  bun run build && \
  pnpm --filter-prod @vibescraper/website --prod deploy dist

# ============================================
# Production Runtime
# ============================================
FROM oven/bun:latest AS runtime

# Build arguments for dynamic labels
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# OCI Image Annotations
LABEL "org.opencontainers.image.title"="Vibescraper"
LABEL "org.opencontainers.image.description"="Modern web scraping and data extraction platform with AI-powered tools"
LABEL "org.opencontainers.image.authors"="Gaurav Khanna <gaurav@gvkhna.com>"
LABEL "org.opencontainers.image.url"="https://aivibescraper.com"
LABEL "org.opencontainers.image.source"="https://github.com/gvkhna/vibescraper"
LABEL "org.opencontainers.image.documentation"="https://docs.aivibescraper.com"
LABEL "org.opencontainers.image.vendor"="Vibescraper"
LABEL "org.opencontainers.image.licenses"="FSL-1.1-MIT"
LABEL "org.opencontainers.image.ref.name"="vibescraper"

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy Deno binary for sandbox functionality
COPY --from=deno /deno /usr/local/bin/deno

WORKDIR /dist

# Copy built application
COPY --from=build /app/dist ./

# Runtime configuration
EXPOSE 4321
ENV PORT=4321
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:4321/health || exit 1

# Run the application
CMD bun /dist/node_modules/drizzle-kit/bin.cjs migrate && bun /dist/server/entry.mjs