#!/bin/zsh

set -euo pipefail

# Build using Apple's `container` CLI with the existing Dockerfile

ROOT_DIR=$(cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT_DIR"

# Ensure submodule is present
git submodule update --init --recursive

# Build the image (arm64 linux)
container build \
  --os linux \
  --arch arm64 \
  -f docker/linux-tauri-build/Dockerfile \
  -t dive-builder:apple \
  .

# Run the container to build artifacts (bind mount workspace)
container run --rm \
  --os linux \
  --arch arm64 \
  --mount type=bind,source=$ROOT_DIR,target=/app,readonly=false \
  dive-builder:apple

echo "Apple container build completed. Check src-tauri/target/release/bundle for artifacts."

