# Stage 1: Get Deno binary
FROM denoland/deno:bin AS deno

# Stage 2: Get wget binary from busybox (static binary)
FROM busybox:latest AS wget

# Stage 3: Final runtime image
FROM oven/bun:latest

# Add metadata labels
LABEL org.opencontainers.image.title="Vibescraper"
LABEL org.opencontainers.image.description="Modern web scraping and data extraction platform with AI-powered tools"
LABEL org.opencontainers.image.url="https://aivibescraper.com"
LABEL org.opencontainers.image.source="https://github.com/gvkhna/vibescraper"
LABEL org.opencontainers.image.vendor="Gaurav Khanna"
LABEL org.opencontainers.image.authors="Gaurav Khanna <gaurav@gvkhna.com>"

# Copy Deno binary from the deno stage
COPY --from=deno /deno /usr/local/bin/deno

# Copy wget binary from busybox (statically linked)
COPY --from=wget /bin/wget /usr/bin/wget

WORKDIR /dist

# Copy the entire pruned package created by pnpm deploy
# This includes all dependencies (including workspace packages) already installed
COPY dist/ ./

EXPOSE 4321

# Set environment variables
ENV PORT=4321
ENV NODE_ENV=production

# Add health check using wget (statically linked from busybox)
# --interval=30s: Check every 30 seconds
# --timeout=10s: Wait max 10 seconds for response
# --start-period=40s: Give container 40 seconds to start before marking unhealthy
# --retries=3: Mark unhealthy after 3 consecutive failures
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4321/health || exit 1

# Run the application directly from /dist
CMD ["bun", "dist/server/entry.mjs"]