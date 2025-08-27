#!/bin/bash
set -e

# Configuration
IMAGE_NAME="vibescraper-test:latest"
CONTAINER_NAME="vibescraper-smoke-test"
DB_CONTAINER_NAME="postgres-smoke-test"
NETWORK_NAME="vibescraper-test-network"
PORT="4321"
HEALTH_URL="http://localhost:${PORT}/health"
POSTGRES_IMAGE="postgres:17-alpine"

# Create network
echo "Creating test network..."
docker network create "$NETWORK_NAME"

# Start PostgreSQL with multiple registry fallbacks
echo "Starting PostgreSQL..."
(docker pull "$POSTGRES_IMAGE" || \
 docker pull "gcr.io/google-containers/$POSTGRES_IMAGE" || \
 docker pull "quay.io/postgres/$POSTGRES_IMAGE" || \
 docker pull "registry-1.docker.io/library/$POSTGRES_IMAGE") && \
docker run -d \
  --name "$DB_CONTAINER_NAME" \
  --network "$NETWORK_NAME" \
  --network-alias postgres \
  -e POSTGRES_USER="testuser" \
  -e POSTGRES_PASSWORD="testpass" \
  -e POSTGRES_DB="testdb" \
  "$POSTGRES_IMAGE"

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
for i in {1..30}; do
  if docker exec "$DB_CONTAINER_NAME" pg_isready -U testuser -d testdb 2>/dev/null; then
    echo "PostgreSQL is ready"
    break
  fi
  sleep 1
done

# Start app container
echo "Starting app container..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --network "$NETWORK_NAME" \
  -p "${PORT}:${PORT}" \
  --env-file .env.example \
  "$IMAGE_NAME"

# Wait and test health endpoint
echo "Testing health endpoint..."
sleep 5

for i in {1..10}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  echo "Attempt $i/10: HTTP $HTTP_CODE"

  if [ "$HTTP_CODE" = "200" ]; then
    echo "Smoke test PASSED"
    exit 0
  elif [ "$HTTP_CODE" != "000" ]; then
    echo "Smoke test FAILED - HTTP $HTTP_CODE"
    docker logs "$CONTAINER_NAME" --tail 50
    exit 1
  fi

  sleep 3
done

echo "Smoke test FAILED - Health endpoint not responding"
docker logs "$CONTAINER_NAME" --tail 50
exit 1