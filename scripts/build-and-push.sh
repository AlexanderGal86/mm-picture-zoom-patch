#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOCKERFILE="$SCRIPT_DIR/docker/Dockerfile"
REGISTRY="dockerhub.katharsis.ru"
IMAGE_NAME="$REGISTRY/test/mm-picture-zoom"
TAG="10.11.15-patch1"
FULL_TAG="$IMAGE_NAME:$TAG"

echo "Building Docker image: $FULL_TAG"

docker buildx build \
    --platform linux/amd64 \
    -f "$DOCKERFILE" \
    -t "$FULL_TAG" \
    --push \
    "$SCRIPT_DIR"

echo "Image pushed successfully: $FULL_TAG"
