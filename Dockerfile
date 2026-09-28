# Headless FoxDot / SuperCollider renderer for this repository.
#
# FoxDot needs a sound card.  This image removes that requirement with the
# JACK "dummy" driver, which is a *real-time paced* virtual sound card, so the
# synthesis comes out of the real SuperCollider engine at the correct tempo.
#
#   docker compose run --rm render                # render every piece
#   docker compose run --rm render pieces/insist.py --bars 64
#
# Audio is written to ./audio (mounted from the repository).

FROM ubuntu:24.04

LABEL org.opencontainers.image.title="foxdot-music-synthesis" \
      org.opencontainers.image.description="Headless FoxDot + SuperCollider audio renderer" \
      org.opencontainers.source="https://github.com/emircanerkul/foxdot-music-synthesis" \
      org.opencontainers.licenses="MIT"

ENV DEBIAN_FRONTEND="noninteractive" \
    LANG="C.UTF-8" \
    LC_ALL="C.UTF-8" \
    QT_QPA_PLATFORM="offscreen" \
    QTWEBENGINE_DISABLE_SANDBOX="1" \
    QTWEBENGINE_CHROMIUM_FLAGS="--disable-gpu --single-process" \
    PATH="/opt/foxdot-venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# SuperCollider has no audio hardware in here: the JACK *dummy* driver started
# by render.py stands in for a real, real-time paced sound card.

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        ffmpeg \
        jackd2 \
        python3 \
        python3-pip \
        python3-venv \
        supercollider-common \
        supercollider-language \
        supercollider-server \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# FoxDot into its own venv so the system python stays untouched.  Pinned so a
# render is reproducible.
RUN python3 -m venv /opt/foxdot-venv \
    && /opt/foxdot-venv/bin/pip install --no-cache-dir --upgrade pip setuptools wheel \
    && /opt/foxdot-venv/bin/pip install --no-cache-dir "FoxDot==0.9.0" \
    && /opt/foxdot-venv/bin/python -c "import FoxDot; print('FoxDot OK')"

COPY render.py /opt/foxdot-render/render.py
RUN chmod +x /opt/foxdot-render/render.py \
    && mkdir -p /work/audio /work/debug

WORKDIR /work

# Renders pieces/<name>.py into audio/<name>.{wav,mp3,ogg}
ENTRYPOINT ["python3", "/opt/foxdot-render/render.py"]
