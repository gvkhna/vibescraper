# Stage 1: Get Deno binary
FROM denoland/deno:bin AS deno

# Stage 2: Final runtime image
FROM oven/bun:latest

# Copy Deno binary from the deno stage
COPY --from=deno /deno /usr/local/bin/deno

WORKDIR /dist

# Copy the entire pruned package created by pnpm deploy
# This includes all dependencies (including workspace packages) already installed
COPY dist/ ./

EXPOSE 4321

# Set environment variables
ENV PORT=4321
ENV NODE_ENV=production

# Run the application directly from /dist
CMD ["bun", "dist/server/entry.mjs"]