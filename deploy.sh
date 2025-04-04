#!/usr/bin/env bash

# Enable error handling
set -e
set -u
set -o pipefail

echo "=== Deployment Script Started ==="

# Verify environment variables are set
if [ -z "${IMAGE_NAME:-}" ] || [ -z "${CONTAINER_NAME:-}" ]; then
  echo "ERROR: Required environment variables are not set."
  echo "Required: IMAGE_NAME, CONTAINER_NAME"
  exit 1
fi

# Check for existing container instances
CURRENT_INSTANCE=$(docker ps -a -q --filter ancestor="$IMAGE_NAME" --format="{{.ID}}" || echo "")

# Stop existing instance if found
if [ -n "$CURRENT_INSTANCE" ]; then
  echo "Stopping and removing existing container instance: $CURRENT_INSTANCE"
  docker rm $(docker stop $CURRENT_INSTANCE) || echo "Warning: Could not stop existing container"
fi

# Pull latest image
echo "Pulling latest image from Docker Hub: $IMAGE_NAME"
docker pull $IMAGE_NAME

# Check if container with same name exists
CONTAINER_EXISTS=$(docker ps -a | grep $CONTAINER_NAME || echo "")
if [ -n "$CONTAINER_EXISTS" ]; then
  echo "Removing existing container: $CONTAINER_NAME"
  docker rm $CONTAINER_NAME || echo "Warning: Could not remove existing container"
fi

# Create new container
echo "Creating new container..."
docker create -p 80:8080 -p 8444:8444 --name $CONTAINER_NAME $IMAGE_NAME

# Generate certificates
echo "Creating certificate files..."
mkdir -p ./certs

# Create self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./certs/privatekey.pem -out ./certs/server.crt \
  -subj "/CN=localhost"

# Ensure proper permissions
chmod 644 ./certs/privatekey.pem ./certs/server.crt

# Ensure certs directory exists in container
docker start $CONTAINER_NAME
docker exec $CONTAINER_NAME mkdir -p /contact-server/certs
docker stop $CONTAINER_NAME

# Copy certificate files
echo "Copying certificate files to container..."
docker cp ./certs/privatekey.pem $CONTAINER_NAME:/contact-server/certs/privatekey.pem
docker cp ./certs/server.crt $CONTAINER_NAME:/contact-server/certs/server.crt

# Start the container
echo "Starting container..."
docker start $CONTAINER_NAME

echo "=== Deployment completed successfully ==="
