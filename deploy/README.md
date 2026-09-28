# Quick start

```bash
# 1. Point the container CLI at the running Podman machine
#    (the default system connection is stale on this machine):
source container-env.sh

# 2. Build the arm64-native Flutter image (first time only, ~3-5 min):
podman build -f deploy/Dockerfile -t wallpaper-flutter:3.7.7-arm64 deploy/

# 3. Resolve dependencies and build the web app in ONE container
#    (containers are ephemeral, so the pub cache vanishes between runs).
#    --pwa-strategy=none ships an empty service worker — see the note below.
./deploy/flutter-run.sh bash -lc 'flutter pub get && flutter build web --release --pwa-strategy=none'

# 4. Serve it and open http://localhost:8080
docker compose up -d web
```

With `docker compose` instead of the runner script:

```bash
source container-env.sh
docker compose run --rm flutter bash -lc "flutter pub get && flutter build web --release"
docker compose up -d web
```

To rebuild after code changes: repeat steps 3-4.

## What runs where

- Everything happens inside the already-running Podman machine
  (`podman-machine-default`); the host has no Flutter, Dart or Node installed.
- `deploy/flutter-run.sh` is a thin wrapper around `docker run` mirroring the
  compose `flutter` service (same image, workdir, entrypoint and mount).
- `podman compose run` is broken in this Podman 6.0.2 build
  (`unable to upgrade to tcp, received 500`), so the runner script or
  `docker compose up -d web` for serving are used.

## Dependency overrides (pubspec.yaml)

The project's own dependencies are untouched. Two things were needed to make
the 2020-era code compile with a modern-enough SDK:

1. `environment: sdk: ">=2.1.0 <3.0.0"` pins the toolchain to Flutter <= 3.7.x
   (Dart 2.19.x) — hence the 3.7.7 image below.
2. `dependency_overrides` bumps three **transitive** packages (`file`,
   `platform`, `process`) whose resolved versions (5.2.1 / 2.2.1 / 3.0.13)
   no longer compile under Dart 2.19 (dart:io `File.create` gained
   `exclusive`; `Platform.packageRoot` was removed from the SDK).
   3.1.3 is the newest `platform` that still supports Dart 2.19.

## The image (deploy/Dockerfile)

Flutter only publishes linux-x64 SDK bundles, and the old `cirrusci/flutter`
Docker Hub images are deprecated; the newer `ghcr.io/cirruslabs/flutter`
arm64 images start at Flutter 3.10 (Dart 3+), incompatible with this pubspec.
Running amd64 images under the machine's qemu-user emulation is not viable
either — the Dart VM's JIT segfaults under qemu (`DRT_CompileFunction`).

So the image is **native arm64**: it clones Flutter 3.7.7 and plants the
official linux-arm64 Dart SDK (from dart-archive) into `bin/cache`, which
Flutter's `update_dart_sdk.sh` accepts because its engine-stamp check is
architecture-agnostic. Everything then compiles natively.

## Files

| File | Purpose |
| --- | --- |
| `container-env.sh` | Exports `CONTAINER_HOST` for the Podman machine socket |
| `docker-compose.yml` | `flutter` (build) + `web` (nginx) services |
| `deploy/Dockerfile` | Builds `wallpaper-flutter:3.7.7-arm64` |
| `deploy/flutter-run.sh` | One-shot runner mirroring the compose `flutter` service |
| `deploy/flutter-entrypoint.sh` | Container entrypoint (git branch fix, analytics off) |
| `deploy/nginx.conf` | Static serving config for the built web app |
| `deploy/qemu-stress.dart` | Diagnostic used when isolating the emulation issue |

## Service worker / stale bundle gotcha (important for local dev)

Flutter web's default service worker caches app assets **cache-first** by URL
(`/main.dart.js` never changes name). A browser that loaded a previous build
keeps serving that cached bundle — you'll see a fully working UI with 401s
from the API, because the cached bundle still contains the old API key.

Mitigations in place:
- builds use `--pwa-strategy=none` → `flutter_service_worker.js` ships empty
- nginx sends `no-store, no-cache, must-revalidate` for `index.html`,
  `main.dart.js` and `version.json`

If you ever hit the stale-bundle symptom again (empty wallpaper grid + 401s in
the console), do one of:
- open the app in an incognito window (no service worker, empty cache), or
- DevTools → Application → Service Workers → **Unregister**, then
  Application → Storage → **Clear site data**, then hard-reload (Cmd+Shift+R)

## Pexels API key

`lib/data/data.dart` reads the key via `String.fromEnvironment`, injected at
build time (placeholder `"[API_KEY]"` is the fallback if the define is absent):

```bash
./deploy/flutter-run.sh bash -lc \
  'flutter build web --release --dart-define=PEXELS_API_KEY=<your-key>'
```

Note: like any client-side app (and like the original hardcoded key), the key
is visible in the built `main.dart.js`.
