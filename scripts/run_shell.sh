#!/usr/bin/env bash
set -e

IMAGE_NAME="${IMAGE_NAME:-redfrienz/team_13_project:0.1.0}"
CONTAINER_NAME="${CONTAINER_NAME:-team13-farm-village-gui-shell}"

if ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
  docker pull --platform linux/amd64 "$IMAGE_NAME"
fi

docker run --rm -it \
  --platform linux/amd64 \
  -p 127.0.0.1:6080:6080 \
  -p 127.0.0.1:5900:5900 \
  -v "$(pwd):/workspace" \
  -w /workspace \
  --name "$CONTAINER_NAME" \
  "$IMAGE_NAME" \
  bash -c '
    set -e
    export DISPLAY=:99

    Xvfb :99 -screen 0 1280x800x24 &
    sleep 1

    openbox &
    x11vnc -display :99 -forever -shared -rfbport 5900 -nopw &
    /usr/share/novnc/utils/novnc_proxy --vnc localhost:5900 --listen 6080 &

    chmod +x /workspace/build/main || true

    echo ""
    echo "=========================================="
    echo " Container ready."
    echo " Web VNC: http://localhost:6080/vnc.html"
    echo " Run the app manually with:"
    echo "   ./build/main"
    echo "=========================================="
    echo ""

    exec bash
  '
