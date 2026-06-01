#!/usr/bin/env bash
set -e

LOCAL_IMAGE="${LOCAL_IMAGE:-team13-farm-village-gui:latest}"
REMOTE_IMAGE="${REMOTE_IMAGE:-redfrienz/team_13_project:0.1.0}"

if ! docker image inspect "$LOCAL_IMAGE" >/dev/null 2>&1; then
  IMAGE_NAME="$LOCAL_IMAGE" bash docker/docker_build.sh
fi

docker tag "$LOCAL_IMAGE" "$REMOTE_IMAGE"
docker push "$REMOTE_IMAGE"
