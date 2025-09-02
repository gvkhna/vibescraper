# Website Integration Tests

Simple test: start postgres + app container, check `/health` and `/` endpoints.

## Commands

```bash
# Build production image
docker build -f packages/website/Dockerfile -t vibescraper:latest .

# Test it (from this package)
pnpm run test

# Test custom image
DOCKER_IMAGE=my-image:latest pnpm test
```

## Environment Variables

- `DOCKER_IMAGE` - Image to test (default: `vibescraper:latest`)
- `CI` - Set to `true` in CI environments
