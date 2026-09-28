# Helper: point docker/podman CLI at the running podman machine API socket.
# The stale default SSH connection (port 60789) is bypassed with CONTAINER_HOST.
export CONTAINER_HOST=unix:///var/folders/km/l2g6y3zn1q16n0hw63_fb9b80000gn/T/podman/podman-machine-default-api.sock
