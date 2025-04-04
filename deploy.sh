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

# Generate or use provided certificates
echo "Setting up certificate files..."
mkdir -p ./certs

# Use environment variables for certificates
echo "Using certificates from environment variables"
echo "$PK" > ./certs/privatekey.pem
echo "$CRT" > ./certs/server.crt

# Start the container first so we can copy files to it
echo "Starting container..."
docker start $CONTAINER_NAME

# Copy certificate files
echo "Copying certificate files to container..."
docker cp ./certs/privatekey.pem $CONTAINER_NAME:/contact-server/certs/privatekey.pem
docker cp ./certs/server.crt $CONTAINER_NAME:/contact-server/certs/server.crt

echo "=== Deployment completed successfully ==="
