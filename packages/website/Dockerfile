FROM oven/bun:1-slim

# Install pnpm with bun
RUN bun install -g pnpm

WORKDIR /app

# Copy workspace configuration and lockfiles
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy all package.json files for workspace structure
COPY packages/website/package.json ./packages/website/
COPY packages/shared-types/package.json ./packages/shared-types/

# Copy shared-types source (needed for workspace dependency)
COPY packages/shared-types/src ./packages/shared-types/src
COPY packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/shared-types/tsup.config.ts ./packages/shared-types/

# Copy the built website application and source files needed for runtime
COPY packages/website/dist ./packages/website/dist
COPY packages/website/src ./packages/website/src

# Install dependencies using pnpm for proper workspace handling
RUN pnpm install --frozen-lockfile --filter @vibescraper/website...

EXPOSE 4321

# Set environment variables
ENV PORT=4321
ENV NODE_ENV=production

# Set working directory to website package
WORKDIR /app/packages/website

# Run the application
CMD ["bun", "dist/server/entry.mjs"]