# Native arm64 Flutter build environment.
#
# Why this exists: Flutter only publishes linux-x64 SDK bundles, and the pub.dev
# images that used to bundle Flutter (cirrusci/flutter on Docker Hub) are
# deprecated. Running the amd64 image under emulation was not an option either,
# because the Dart VM's JIT crashes under qemu-user.
#
# Dart DOES publish linux-arm64 SDK zips (dart-archive), and Flutter's
# `bin/internal/update_dart_sdk.sh` only compares `engine.version` against
# `engine-dart-sdk.stamp` — it is architecture-agnostic. So we clone Flutter and
# plant the native arm64 Dart SDK in bin/cache. Everything (tool snapshot,
# frontend_server, dart2js) then runs natively on the host CPU.
#
# Flutter 3.7.7 / Dart 2.19.4 is the last release line that still satisfies this
# project's `environment: sdk: ">=2.1.0 <3.0.0"` constraint, so the project
# itself needs no dependency changes.
#
FROM docker.io/library/ubuntu:22.04
ARG FLUTTER_VERSION=3.7.7
ARG DART_VERSION=2.19.4

ENV FLUTTER_HOME=/sdks/flutter \
    FLUTTER_ROOT=/sdks/flutter \
    FLUTTER_SUPPRESS_ANALYTICS=true \
    DEBIAN_FRONTEND=noninteractive
ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${FLUTTER_HOME}/bin:${FLUTTER_HOME}/bin/cache/dart-sdk/bin

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash ca-certificates curl git unzip xz-utils zip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /sdks
RUN git clone --depth 1 --branch ${FLUTTER_VERSION} https://github.com/flutter/flutter.git ${FLUTTER_HOME}

# Plant the native arm64 Dart SDK and satisfy Flutter's engine stamp check so
# the tool never tries to download the x64 one.
RUN mkdir -p ${FLUTTER_HOME}/bin/cache \
    && curl -fsSL -o /tmp/dart.zip \
        "https://storage.googleapis.com/dart-archive/channels/stable/release/${DART_VERSION}/sdk/dartsdk-linux-arm64-release.zip" \
    && unzip -q /tmp/dart.zip -d /tmp/dart \
    && rm -rf ${FLUTTER_HOME}/bin/cache/dart-sdk \
    && mv /tmp/dart/dart-sdk ${FLUTTER_HOME}/bin/cache/dart-sdk \
    && rm -rf /tmp/dart /tmp/dart.zip \
    && cp ${FLUTTER_HOME}/bin/internal/engine.version ${FLUTTER_HOME}/bin/cache/engine-dart-sdk.stamp \
    && ${FLUTTER_HOME}/bin/cache/dart-sdk/bin/dart --version

# Attach HEAD to a branch named "stable": on a detached HEAD the Flutter tool
# would `git fetch` the entire flutter/flutter history on every command.
RUN git -C ${FLUTTER_HOME} checkout -B stable

# Warm the tool: resolves flutter_tools' dependencies into the image's pub
# cache and compiles the flutter_tools snapshot (both fully native on arm64).
RUN flutter --version \
    && flutter config --no-analytics

# Web build artifacts (dart2js, CanvasKit — all architecture independent).
RUN flutter precache --web
