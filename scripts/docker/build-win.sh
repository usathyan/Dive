#!/bin/bash

echo "Building Docker image..."
docker build \
  -f docker/win-build/Dockerfile \
  -t lla-builder-win .

echo "Building Windows executable..."
docker run --rm \
  -v ${PWD}/release:/app/release \
  lla-builder-win

echo "Build complete! Check the release folder for output." 