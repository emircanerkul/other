#!/usr/bin/env bash
# Run a command inside the old-Flutter container, mirroring the `flutter`
# service of docker-compose.yml (same image, mount and entrypoint).
#
# Usage: deploy/flutter-run.sh <command...>
#   source container-env.sh && ./deploy/flutter-run.sh flutter pub get
set -e
source "$(dirname "$0")/../container-env.sh"
cd "$(dirname "$0")/.."

exec docker run --rm \
  -w /app \
  -v "$PWD:/app" \
  --entrypoint /app/deploy/flutter-entrypoint.sh \
  wallpaper-flutter:3.7.7-arm64 "$@"
