#!/bin/bash

set -e  # Exit on error

echo "================================================================"
echo "Local Docker Build - Test Production Image"
echo "================================================================"

# Clean up any existing containers/images
echo "Cleaning up existing containers..."
podman stop vibescraper-local || true
podman rm vibescraper-local || true
podman rmi vibescraper:latest || true

echo ""

# Create clean build directory
echo "Creating clean build directory..."
rm -rf build
mkdir build

echo "Copying git-tracked and untracked files..."
git ls-files -coz --exclude-standard | rsync -av --files-from=- --from0 ./ build/

# Build production image from clean build directory
echo "Building production Docker image..."
IMAGE_NAME="vibescraper:latest"

echo "Starting podman build..."
podman build \
  --file ./build/packages/website/Dockerfile \
  --tag "$IMAGE_NAME" \
  --progress=plain \
  build

echo "Podman build completed."
echo "Cleaning up build directory..."
rm -rf build

# Show image details
echo "Image built: "
podman images "$IMAGE_NAME"

# Get image size
IMAGE_SIZE=$(podman image inspect "$IMAGE_NAME" --format='{{.Size}}' 2>/dev/null || echo "0")
if [ "$IMAGE_SIZE" != "0" ]; then
    HUMAN_SIZE=$(numfmt --to=iec --suffix=B --padding=7 "$IMAGE_SIZE" 2>/dev/null || echo "${IMAGE_SIZE} bytes")
    echo "Image size: $HUMAN_SIZE"
fi


echo "Next steps:"
echo "  # Test the image:"
echo "  pnpm test:integration"
echo ""
echo "  # Run manually:"
echo "  podman run -it -p 4321:4321 --env-file .env vibescraper:latest"