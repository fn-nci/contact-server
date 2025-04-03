#!/bin/bash

# Script to check SSL/TLS configuration in Docker containers

CONTAINER_NAME=${1:-$CONTAINER_NAME}

if [ -z "$CONTAINER_NAME" ]; then
  echo "Error: Container name not provided"
  echo "Usage: $0 <container_name>"
  exit 1
fi

echo "===== Checking SSL for container $CONTAINER_NAME ====="

# Get container IP
CONTAINER_IP=$(docker inspect $CONTAINER_NAME --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "Container IP: $CONTAINER_IP"

# Check if server.crt and privatekey.pem exist in the container
echo "Checking for SSL certificate files in container..."
docker exec $CONTAINER_NAME ls -la /server.crt /privatekey.pem || echo "Certificate files not found in expected location"

# Check if ports are listening
echo "Checking container ports..."
docker exec $CONTAINER_NAME netstat -tuln || echo "netstat not available"

# Test SSL connection with openssl
echo "Testing SSL connection with OpenSSL..."
echo | openssl s_client -connect $CONTAINER_IP:8444 -showcerts -prexit || echo "SSL connection test failed"

echo "===== SSL check completed =====" 