#!/bin/bash

# Script to build and run the contact-server container locally

# Stop existing containers
echo "Stopping any existing containers..."
docker stop contact-server-local 2>/dev/null || true
docker rm contact-server-local 2>/dev/null || true

# Build the image
echo "Building Docker image..."
docker build -t contact-server-local:latest .

# Run the container
echo "Running the container..."
docker run -d --name contact-server-local \
  -p 8444:8444 \
  contact-server-local:latest

# Check if container is running
echo "Checking container status..."
docker ps -a | grep contact-server-local

# Follow logs
echo "Showing container logs (press Ctrl+C to exit):"
docker logs -f contact-server-local 