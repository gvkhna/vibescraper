# Website Integration Tests

Simple test: start postgres + app container, check `/health` and `/` endpoints.

## Commands

```bash
# Build production image
docker build -f packages/website/Dockerfile -t vibescraper:latest .

# Test it (from root)
pnpm test:integration

# Test it (from this package)
pnpm test

# Test custom image
DOCKER_IMAGE=my-image:latest pnpm test
```

## What it does

1. Starts PostgreSQL container
2. Starts your production Docker image  
3. Checks `/health` returns 200
4. Checks `/` returns 200
5. Cleans up containers

## Environment Variables

- `DOCKER_IMAGE` - Image to test (default: `vibescraper:latest`)
- `CI` - Set to `true` in CI environments

## Files

- `test.test.ts` - The vitest test
- `vitest.config.ts` - Simple config with timeouts
- `package.json` - Scripts to run it

That's it.