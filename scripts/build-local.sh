#!/bin/bash

set -e  # Exit on error

echo "================================================================"
echo "Local Build Script - Simulating GitHub Actions"
echo "================================================================"

# Load environment from .env.deploy
if [ -f .env.deploy ]; then
    echo "Loading environment from .env.deploy"
    set -a  # Mark all new variables for export
    source .env.deploy
    set +a
else
    echo "ERROR: .env.deploy file not found"
    exit 1
fi

# Set additional build environment variables
export DO_NOT_TRACK=1
export ASTRO_TELEMETRY_DISABLED=1
export BETTER_AUTH_TELEMETRY=0
export BUILD_PATH='.'

echo ""
echo "Build Environment:"
echo "NODE_ENV=$NODE_ENV"
echo "DEBUG=$DEBUG"
echo "DEBUG_COLORS=$DEBUG_COLORS"
echo "DEBUG_HIDE_DATE=$DEBUG_HIDE_DATE"
echo "TMP_DIR=$TMP_DIR"
echo ""

# Step 1: Deep clean all build artifacts (simulating fresh clone)
echo "Step 1: Deep cleaning all build artifacts..."
echo "Removing node_modules..."
rm -rf node_modules
rm -rf packages/*/node_modules
echo "Removing dist directories..."
rm -rf dist
rm -rf packages/*/dist
echo "Removing .astro cache..."
rm -rf packages/website/.astro
echo "Removing .tanstack cache..."
rm -rf packages/website/.tanstack
echo "Removing turbo cache..."
rm -rf .turbo
rm -rf packages/*/.turbo

# Step 2: Verify tools
echo "Step 2: Verifying tools..."
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"
echo "Bun version: $(bun --version)"
echo "Podman version: $(podman --version)"
echo ""

# Step 3: Install dependencies (fresh like GitHub Actions)
echo "Step 3: Installing dependencies..."
pnpm install --frozen-lockfile
echo ""

# Step 4: Build all packages with turbo
echo "Step 4: Building all packages with turbo..."
bun run build
echo ""

# Step 5: Create dist deployable package
echo "Step 5: Creating dist deployable package with pnpm deploy..."
rm -rf ./dist
bun run deploy:website
echo "Deployable package created in ./dist"
echo ""

# Step 6: Build Docker image with Podman
echo "Step 6: Building container image with Podman..."
IMAGE_NAME="vibescraper-local:latest"
echo "Building image: $IMAGE_NAME"

podman build \
  --file ./packages/website/Dockerfile \
  --tag "$IMAGE_NAME" \
  .

echo ""

# Step 7: Log image details
echo "Step 7: Image details:"
podman images "$IMAGE_NAME"

# Get image size
IMAGE_SIZE=$(podman image inspect "$IMAGE_NAME" --format='{{.Size}}' 2>/dev/null || echo "0")
if [ "$IMAGE_SIZE" != "0" ]; then
    # Convert to human readable
    HUMAN_SIZE=$(numfmt --to=iec --suffix=B --padding=7 "$IMAGE_SIZE" 2>/dev/null || echo "${IMAGE_SIZE} bytes")
    echo "Image size: $HUMAN_SIZE"
fi

echo ""
echo "Build completed successfully!"
echo ""
echo "To run the container locally:"
echo "  podman run -it -p 4321:4321 --env-file .env $IMAGE_NAME"
echo ""
echo "To save the image for deployment:"
echo "  podman save $IMAGE_NAME | gzip > vibescraper-local.tar.gz"
echo ""
echo "To tag for GitHub Container Registry (when ready):"
echo "  podman tag $IMAGE_NAME ghcr.io/gvkhna/vibescraper:latest"
echo "  podman push ghcr.io/gvkhna/vibescraper:latest"