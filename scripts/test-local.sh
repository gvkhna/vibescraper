#!/usr/bin/env bash
set -euo pipefail

# Smoke test script for container deployment
# This script starts PostgreSQL, then the app container, and tests the health endpoint

# Configuration
IMAGE_NAME="vibescraper-local:latest"
CONTAINER_NAME="vibescraper-test-$(date +%s)"
DB_CONTAINER_NAME="postgres-test"
NETWORK_NAME="vibescraper-test-network"
PORT="4321"
HEALTH_URL="http://localhost:${PORT}/health"
ENV_FILE=".env.example"
MAX_RETRIES=10
RETRY_DELAY=3

echo "========================================="
echo "Vibescraper Container Smoke Test"
echo "========================================="
echo ""

# Check if image exists
if ! podman image exists "$IMAGE_NAME"; then
    echo "Error: Image $IMAGE_NAME not found"
    echo "Please run ./scripts/build-local.sh first to build the image"
    exit 1
fi

# Check if .env.example file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found"
    exit 1
fi

# Function to cleanup containers and network
cleanup() {
    echo ""
    echo "Cleaning up..."
    
    if [ -n "${CONTAINER_NAME:-}" ] && podman container exists "$CONTAINER_NAME" 2>/dev/null; then
        echo "Stopping app container..."
        podman stop "$CONTAINER_NAME" 2>/dev/null || true
        echo "App container stopped: $CONTAINER_NAME"
    fi
    
    if [ -n "${DB_CONTAINER_NAME:-}" ] && podman container exists "$DB_CONTAINER_NAME" 2>/dev/null; then
        echo "Stopping database container..."
        podman stop "$DB_CONTAINER_NAME" 2>/dev/null || true
        podman rm "$DB_CONTAINER_NAME" 2>/dev/null || true
        echo "Database container removed: $DB_CONTAINER_NAME"
    fi
    
    if [ -n "${NETWORK_NAME:-}" ] && podman network exists "$NETWORK_NAME" 2>/dev/null; then
        echo "Removing test network..."
        podman network rm "$NETWORK_NAME" 2>/dev/null || true
        echo "Network removed: $NETWORK_NAME"
    fi
    
    echo "Cleanup completed"
    echo "To remove app container: podman rm $CONTAINER_NAME"
}

# Set up trap to cleanup on exit
trap cleanup EXIT

# Create network for containers
echo "Creating test network..."
podman network create "$NETWORK_NAME"
echo "Network created: $NETWORK_NAME"
echo ""

# Start PostgreSQL container
echo "Starting PostgreSQL container..."
podman run -d \
    --name "$DB_CONTAINER_NAME" \
    --network "$NETWORK_NAME" \
    --network-alias postgres \
    -e POSTGRES_USER="testuser" \
    -e POSTGRES_PASSWORD="testpass" \
    -e POSTGRES_DB="testdb" \
    postgres:16-alpine

echo "PostgreSQL container started: $DB_CONTAINER_NAME"
echo ""

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
POSTGRES_READY=false
for i in {1..30}; do
    if podman exec "$DB_CONTAINER_NAME" pg_isready -U testuser -d testdb 2>/dev/null; then
        POSTGRES_READY=true
        echo "PostgreSQL is ready"
        break
    fi
    echo "  Waiting... (attempt $i/30)"
    sleep 1
done

if [ "$POSTGRES_READY" = false ]; then
    echo "Error: PostgreSQL failed to start"
    exit 1
fi
echo ""

# Start app container
echo "Starting app container..."
podman run -d \
    --name "$CONTAINER_NAME" \
    --network "$NETWORK_NAME" \
    -p "${PORT}:${PORT}" \
    --env-file "$ENV_FILE" \
    "$IMAGE_NAME"

echo "App container started: $CONTAINER_NAME"
echo ""

# Show initial logs
echo "App container startup logs:"
echo "----------------------------------------"
sleep 3
podman logs "$CONTAINER_NAME" 2>&1
echo "----------------------------------------"
echo ""

# Test health endpoint
echo "Testing health endpoint..."
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))

    # Check if container is still running
    CONTAINER_STATUS=$(podman container inspect "$CONTAINER_NAME" --format '{{.State.Status}}' 2>/dev/null || echo "removed")
    if [ "$CONTAINER_STATUS" != "running" ]; then
        echo "Error: Container is not running (status: $CONTAINER_STATUS)"
        echo ""
        echo "Final container logs:"
        podman logs "$CONTAINER_NAME" 2>&1
        exit 1
    fi

    # Try health endpoint
    echo "Attempt $RETRY_COUNT/$MAX_RETRIES: curl $HEALTH_URL"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    echo "Response: HTTP $HTTP_CODE"

    if [ "$HTTP_CODE" = "200" ]; then
        echo ""
        echo "========================================="
        echo "TEST PASSED - Server is healthy"
        echo "========================================="
        exit 0
    elif [ "$HTTP_CODE" != "000" ]; then
        # Got a real HTTP response but not 200
        echo ""
        echo "========================================="
        echo "TEST FAILED - Server returned HTTP $HTTP_CODE"
        echo "========================================="
        echo ""
        echo "Recent container logs:"
        podman logs --tail 20 "$CONTAINER_NAME" 2>&1
        exit 1
    fi

    # Only sleep if we're going to retry
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        sleep $RETRY_DELAY
    fi
done

# If we get here, health endpoint never responded
echo ""
echo "========================================="
echo "TEST FAILED - Health endpoint not responding"
echo "========================================="
echo ""
echo "Final container logs:"
podman logs "$CONTAINER_NAME" 2>&1
exit 1