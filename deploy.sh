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
if [ -z "${IMAGE_NAME:-}" ] || [ -z "${CONTAINER_NAME:-}" ] || [ -z "${SERVER:-}" ] || [ -z "${PRIVATE_KEY:-}" ]; then
  echo "ERROR: Required environment variables are not set."
  echo "Required: IMAGE_NAME, CONTAINER_NAME, SERVER, PRIVATE_KEY"
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

# CONTAINER_NAME -> contact_server
#check if a docker container exists with the name of contact_server if it does remove the container
echo "Checking for existing container with name: $CONTAINER_NAME"
CONTAINER_EXISTS=$(docker ps -a | grep $CONTAINER_NAME || echo "")
if [ -n "$CONTAINER_EXISTS" ]; then
  echo "Removing existing container: $CONTAINER_NAME"
  docker rm $CONTAINER_NAME || echo "Warning: Could not remove existing container"
else
  echo "No existing container with name $CONTAINER_NAME found."
fi

#create a container called contact_server that is available on port 8444 from our docker image
echo "Creating new container..."
docker create -p 8444:8444 --name $CONTAINER_NAME $IMAGE_NAME

#write the private key to a file
echo "Writing private key and certificate files..."
echo "$PRIVATE_KEY" > privatekey.pem
echo "$SERVER" > server.crt

#add the private key and cert to the container
echo "Copying certificate files to container..."
docker cp ./privatekey.pem $CONTAINER_NAME:/privatekey.pem
docker cp ./server.crt $CONTAINER_NAME:/server.crt

#start the contact_server container
echo "Starting container..."
docker start $CONTAINER_NAME

echo "=== Deployment completed successfully ==="
