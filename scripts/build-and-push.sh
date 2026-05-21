#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOCKERFILE="$SCRIPT_DIR/docker/Dockerfile"
REGISTRY="dockerhub.xxxxxxxx.ru"
IMAGE_NAME="$REGISTRY/test/mm-picture-zoom"
TAG="10.11.15-patch1"
FULL_TAG="$IMAGE_NAME:$TAG"

echo "Building Docker image: $FULL_TAG"

docker build \
    -f "$DOCKERFILE" \
    -t "$FULL_TAG" \
    "$SCRIPT_DIR"

echo "Image built: $FULL_TAG"

if [ "${PUSH:-false}" = "true" ]; then
    echo "Pushing to $FULL_TAG..."
    docker push "$FULL_TAG"
fi
