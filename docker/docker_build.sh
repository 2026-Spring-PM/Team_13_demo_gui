#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${IMAGE_NAME:-team13-farm-village-gui:latest}"

docker build \
  --platform linux/amd64 \
  -t "$IMAGE_NAME" \
  -f "$ROOT_DIR/docker/Dockerfile" \
  "$ROOT_DIR"
