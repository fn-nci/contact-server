#!/usr/bin/env bash

# Enable error handling and debugging
set -e  # Exit immediately if a command exits with a non-zero status
set -u  # Treat unset variables as an error
set -o pipefail  # Ensure pipe failures are caught properly

# Print debugging information about the environment
echo "=== Deployment Script Started ==="
echo "Working directory: $(pwd)"
echo "User: $(whoami)"
echo "Docker status: $(docker info 2>&1 | grep 'Server Version' || echo 'Docker not available')"

# Verify environment variables are set
if [ -z "${IMAGE_NAME:-}" ] || [ -z "${CONTAINER_NAME:-}" ]; then
  echo "ERROR: Required environment variables are not set."
  echo "Required: IMAGE_NAME, CONTAINER_NAME"
  exit 1
fi

echo "All required environment variables are set."

# check if there is instance running with the image name we are deploying
echo "Checking for existing container instances..."
CURRENT_INSTANCE=$(docker ps -a -q --filter ancestor="$IMAGE_NAME" --format="{{.ID}}" || echo "")

#if an instance does exist stop the instance
if [ -n "$CURRENT_INSTANCE" ]; then
  echo "Stopping and removing existing container instance: $CURRENT_INSTANCE"
  docker rm $(docker stop $CURRENT_INSTANCE) || echo "Warning: Could not stop existing container"
else
  echo "No existing container instance found."
fi

#pull down the instance from dockerhub 
echo "Pulling latest image from Docker Hub: $IMAGE_NAME"
docker pull $IMAGE_NAME

#check if a docker container exists with the name of node_app if it does remove the container
echo "Checking for existing container with name: $CONTAINER_NAME"
CONTAINER_EXISTS=$(docker ps -a | grep $CONTAINER_NAME || echo "")
if [ -n "$CONTAINER_EXISTS" ]; then
  echo "Removing existing container: $CONTAINER_NAME"
  docker rm $CONTAINER_NAME || echo "Warning: Could not remove existing container"
else
  echo "No existing container with name $CONTAINER_NAME found."
fi

#create a container called node_app that is available on ports 8080 and 8444 from our docker image
echo "Creating new container..."
docker create -p 80:8080 -p 8444:8444 --name $CONTAINER_NAME $IMAGE_NAME

# Generate self-signed certificates for testing
echo "Creating certificate files..."
mkdir -p ./certs

# Install OpenSSL if not available
if ! command -v openssl &> /dev/null; then
  echo "OpenSSL not found, attempting to install..."
  apt-get update && apt-get install -y openssl || yum install -y openssl || {
    echo "Failed to install OpenSSL. Please install it manually."
    exit 1
  }
fi

# Create self-signed certificate
echo "Generating self-signed certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./certs/privatekey.pem -out ./certs/server.crt \
  -subj "/CN=localhost"

# Ensure proper permissions on host
chmod 644 ./certs/privatekey.pem ./certs/server.crt

# Display file contents for verification (first few lines)
echo "Verifying certificate files:"
ls -la ./certs/privatekey.pem ./certs/server.crt
echo "Private key (first 3 lines):"
head -3 ./certs/privatekey.pem || echo "Failed to read private key"
echo "Certificate (first 3 lines):"
head -3 ./certs/server.crt || echo "Failed to read certificate"

# Ensure the certs directory exists in the container
echo "Ensuring certificates directory exists in container..."
docker start $CONTAINER_NAME
docker exec $CONTAINER_NAME mkdir -p /contact-server/certs
docker stop $CONTAINER_NAME

# Copy certificate files to a location that nodeuser can access
echo "Copying certificate files to container..."
docker cp ./certs/privatekey.pem $CONTAINER_NAME:/contact-server/certs/privatekey.pem
docker cp ./certs/server.crt $CONTAINER_NAME:/contact-server/certs/server.crt

# Start the container
echo "Starting container..."
docker start $CONTAINER_NAME

# Verify certificates in the container
echo "Verifying certificate files in container:"
docker exec $CONTAINER_NAME ls -la /contact-server/certs/privatekey.pem /contact-server/certs/server.crt || echo "Files not found in container"
docker exec $CONTAINER_NAME bash -c "cat /contact-server/certs/privatekey.pem | head -3" || echo "Failed to read private key"
docker exec $CONTAINER_NAME bash -c "cat /contact-server/certs/server.crt | head -3" || echo "Failed to read certificate"

# No need to create symbolic links - the server.js has been updated to look in both locations
echo "=== Deployment completed successfully ==="
