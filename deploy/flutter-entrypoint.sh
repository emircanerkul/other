#!/usr/bin/env bash
# Entrypoint for the Flutter service.
#
# One fix needed for containerized Flutter: images leave the Flutter SDK
# checkout on a detached HEAD, which makes the tool run
# `git fetch <remote> --tags` (the entire flutter/flutter history) on every
# command. Attaching HEAD to a branch named "stable" makes the tool skip
# that fetch entirely.
FLUTTER_ROOT="${FLUTTER_ROOT:-$HOME/sdks/flutter}"
[ -d "$FLUTTER_ROOT/.git" ] || FLUTTER_ROOT=/sdks/flutter
[ -d "$FLUTTER_ROOT/.git" ] && git -C "$FLUTTER_ROOT" checkout -B stable >/dev/null 2>&1

export FLUTTER_SUPPRESS_ANALYTICS=true
exec "$@"
