FROM denoland/deno:bin AS deno
FROM node:lts AS build

WORKDIR /app

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
  bun turbo run astro:check --filter=@vibescraper/website && \
  bun run build && \
  pnpm --filter-prod @vibescraper/website --prod deploy dist

# ============================================
# Production Runtime
# ============================================
FROM oven/bun:latest AS runtime

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
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4321/health || exit 1

# Run the application
CMD ["bun", "dist/server/entry.mjs"]