#!/usr/bin/env bash
set -e

LOCAL_IMAGE="${LOCAL_IMAGE:-team13-farm-village-gui:latest}"
REMOTE_IMAGE="${REMOTE_IMAGE:-redfrienz/team_13_project:0.1.0}"

IMAGE_NAME="$LOCAL_IMAGE" bash docker/docker_build.sh
docker tag "$LOCAL_IMAGE" "$REMOTE_IMAGE"
docker push "$REMOTE_IMAGE"
