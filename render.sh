#!/usr/bin/env bash
#
# Render the FoxDot pieces in this repository to audio - no sound card needed.
#
#   ./render.sh                        # every piece in pieces/
#   ./render.sh pieces/insist.py       # just one piece
#   ./render.sh -- --bars 64           # forward extra flags to render.py
#
# Prefers `docker compose` when it is available and falls back to plain
# `docker build` + `docker run` otherwise.  Some runtimes - the `docker` shim in
# front of podman, for instance - resolve `compose` through the machine
# connection and fail even though `docker build` itself works fine.
#
# Every piece gets its own container, so the renders cannot interfere with one
# another (each one starts its own JACK server, sclang and scsynth).
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --------------------------------------------------------------------------- #
# arguments: pieces are paths, everything else is forwarded to render.py
# --------------------------------------------------------------------------- #
PIECES=()
ARGS=()
while [ $# -gt 0 ]; do
    case "$1" in
        --)  shift; ARGS+=("$@"); break ;;
        -*)  ARGS+=("$1"); shift ;;
        *)   PIECES+=("$1"); shift ;;
    esac
done
[ ${#PIECES[@]} -eq 0 ] && PIECES=(pieces/*.py)

# --------------------------------------------------------------------------- #
# how to invoke the renderer
# --------------------------------------------------------------------------- #
IMAGE="foxdot-music-synthesis:latest"
REPO_DIR="$(pwd -P)"

if [ -f /opt/foxdot-render/render.py ]; then
    # already inside the container
    RUN=(python3 /opt/foxdot-render/render.py)
elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    echo ">> building image"
    docker compose build render
    RUN=(docker compose run --rm render)
elif command -v docker >/dev/null 2>&1; then
    echo ">> 'docker compose' is unavailable, using 'docker run' directly"
    docker image inspect "$IMAGE" >/dev/null 2>&1 || {
        echo ">> building image (this takes a few minutes)"
        docker build -t "$IMAGE" .
    }
    RUN=(docker run --rm -v "$REPO_DIR:/work" "$IMAGE")
else
    echo "error: neither a container runtime nor the foxdot image was found." >&2
    echo "       Install Docker/Podman, or run this from inside the image." >&2
    exit 1
fi

# --------------------------------------------------------------------------- #
# render every piece
# --------------------------------------------------------------------------- #
rc=0
for piece in "${PIECES[@]}"; do
    name="$(basename "$piece" .py)"
    echo
    echo "=================================================================="
    echo ">> rendering $piece"
    echo "=================================================================="
    # The repository is always mounted at /work inside the container, so the
    # same paths work whether we are on the host or inside the image.
    "${RUN[@]}" \
        --piece "/work/$piece" \
        --name "$name" \
        --out /work/audio \
        --workdir "/work/debug/$name" \
        ${ARGS[@]+"${ARGS[@]}"} || rc=1
done

if [ "$rc" -eq 0 ]; then
    echo
    echo "All pieces rendered -> ./audio"
fi
exit "$rc"
