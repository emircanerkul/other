## I make Music with Python FoxDot & SuperCollider

I write pieces with [FoxDot](https://github.com/Qirky/FoxDot) and play them live
on the [SuperCollider](https://github.com/supercollider/supercollider) synthesis
engine. The audio in this repository is rendered **headlessly in Docker** - no
sound card involved - so every file here comes out of the real SuperCollider
engine, not a screen recording of it.

### My Pieces

| Name of Piece | Code | Listen |
| :--- | :---: | :---: |
| **Almost Done** | [![Python Code](https://img.shields.io/badge/Python-blue?style=flat-square&logo=python&logoColor=white)](pieces/almost_done.py) | [![Listen](https://img.shields.io/badge/%E2%96%B6_Listen-1DB954?style=flat-square&logo=musicbrainz&logoColor=white)](audio/almost_done.mp3?raw=true) [![SoundCloud](https://img.shields.io/badge/SoundCloud-orange?style=flat-square&logo=soundcloud&logoColor=white)](https://soundcloud.com/emircanerkul/almost-done) |
| **Insist** | [![Python Code](https://img.shields.io/badge/Python-blue?style=flat-square&logo=python&logoColor=white)](pieces/insist.py) | [![Listen](https://img.shields.io/badge/%E2%96%B6_Listen-1DB954?style=flat-square&logo=musicbrainz&logoColor=white)](audio/insist.mp3?raw=true) [![SoundCloud](https://img.shields.io/badge/SoundCloud-orange?style=flat-square&logo=soundcloud&logoColor=white)](https://soundcloud.com/emircanerkul/insist) |

Both pieces are 16 bars long (32 seconds) at FoxDot's default 120 BPM in 4/4,
with a short fade-in and a 2 s fade-out at the end.

> **Do these loop seamlessly?** No, and it is worth knowing why. Each player in a
> piece runs its own cycle, and those cycles only realign on a much longer
> boundary: in `insist` the pads repeat every 12.5 beats while the blip runs on 11
> beats and the pluck on 2, so all of them only line up again after 550 beats
> (137.5 bars); in `almost_done` it is every 195 beats (48.75 bars). 16 bars is
> therefore a deliberate cut with a fade rather than a loop point - if you want a
> genuinely seamless version, render `--bars 195` for `almost_done` and
> `--bars 138` (then trim the tail) for `insist`.

---

## Audio: WAV, MP3 or OGG?

Short answer: **WAV is by far the biggest, MP3 is the safest, OGG is the
smallest here.** All three files for both pieces live in [`audio/`](audio), each
exactly 32 s of stereo 44.1 kHz audio:

| Format | `almost_done` | `insist` | Bitrate | Every browser? |
| :--- | ---: | ---: | ---: | :---: |
| `audio/*.wav` | **8.47 MB** (8.08 MiB) | **8.47 MB** (8.08 MiB) | 1411 kbps | No (IE 11) |
| `audio/*.mp3` | **0.77 MB** (0.73 MiB) | **0.77 MB** (0.73 MiB) | 192 kbps CBR | **Yes** |
| `audio/*.ogg` | **0.60 MB** (0.57 MiB) | **0.43 MB** (0.41 MiB) | ~112-155 kbps VBR | No (Safari needs 18.4+) |

* **WAV** - uncompressed PCM, so 44,100 x 2 channels x 2 bytes = 176,400 B/s.
  32 s still weighs 8.5 MB: about 11x an MP3, and 34 MB for the two of them
  together. Perfect quality, but GitHub asks you to keep files under 50 MiB and a
  WAV is pure waste in a repo that can regenerate it in a minute, so it is
  `gitignore`d here (see `--keep-raw` below if you want it). The MP3 is a 192
  kbps CBR encode of that 24-bit master, which is transparent enough for this
  material anyway.
* **MP3** - the one that just works. Universal in every browser since the
  mid-2000s, including every Safari and every iOS, and it is what the **Listen**
  buttons above point at.
* **OGG / Vorbis** - roughly 20-45 % smaller than MP3 for the same quality and
  not patent-encumbered, but **Safari and iOS only support Vorbis from 18.4
  onwards**, so it cannot be the only audio in a `README`.

### Getting it to actually play on GitHub

GitHub strips `<audio>` tags from Markdown, so a README cannot hold a real
inline player - the sanitizer removes the element (and the `src` of any
`<source>` inside it). What does work today:

1. **A link straight to the file** - what the **Listen** buttons above use. The
   `?raw=true` suffix makes GitHub hand over the raw file instead of the blob
   page, and `raw.githubusercontent.com` serves `.mp3` as `audio/mpeg`, so
   Firefox and Safari play it in their native player (Chrome downloads it). A
   plain relative path in a README is enough.
2. **GitHub Pages** - the honest answer if you want an embedded player. Put an
   `index.html` on Pages (Markdown sanitising does not apply there) with a normal
   `<audio controls src="...">` element and link to it from the README. Pages
   cannot be fed from Git LFS.
3. **An audio-only MP4 in a `<video>` tag** - `<video>` *is* on GitHub's
   allowlist, so uploading an audio-only `.mp4`
   (`ffmpeg -i in.wav -c:a aac -vn out.mp4`) and pointing a `<video>` tag at its
   `github.com/user-attachments/assets/<uuid>` URL does play inline. It is
   really a hack: you get video chrome around a blank frame, and attachments are
   community-reported to be garbage collected after ~30 days unless an issue
   references them.

---

## Render it yourself

[`render.py`](render.py) boots the whole chain inside a container:

```
jackd -d dummy   a *real-time paced* virtual sound card
   + scsynth     the real FoxDot synthesis engine
   + sclang      registers FoxDot's OSCFuncs and compiles every SynthDef
   + FoxDot      executes the *unmodified* piece file
   + ffmpeg      trims to the exact length, fades the ends, encodes mp3 + ogg
```

### With Docker Compose (easiest)

```bash
docker compose build render        # ~5 min, one time
docker compose run --rm render     # renders every pieces/*.py into ./audio
```

### With plain Docker

```bash
docker build -t foxdot-music-synthesis .
docker run --rm -v "$PWD:/work" foxdot-music-synthesis \
    --piece /work/pieces/insist.py --name insist --bars 16
```

### With the helper script

```bash
./render.sh                        # every piece in pieces/
./render.sh pieces/insist.py       # just one
./render.sh -- --bars 64           # forward extra flags to render.py
```

### Useful flags

| Flag | Default | Meaning |
| :--- | :--- | :--- |
| `--bars` | `16` | Length in bars (4 beats per bar, 120 BPM = 2 s/bar) |
| `--bpm` | `120` | Tempo, must match the piece |
| `--meter` | `4/4` | Time signature |
| `--fade-out` | `2.0` | Length of the fade-out, in seconds |
| `--formats` | `wav,mp3,ogg` | Which files to write |
| `--bits` | `24` | WAV sample size: 16, 24 or 32 |
| `--keep-raw` | off | Keep the untrimmed master recording in `--workdir` |

Renders land in `audio/`, engine scratch and logs in `debug/` - both `gitignore`d
where they are build output rather than deliverables.

### How the headless part works

FoxDot expects a sound card and a Linux container has none: SuperCollider ships
here with only the JACK audio backend, and `scsynth` refuses to boot without a
JACK server. So `render.py` starts `jackd` with the **dummy** driver - a
real-time paced virtual sound card, so the synthesis still comes out at the
correct tempo - and then boots `sclang` with a generated `Startup.scd` that loads
every FoxDot SynthDef and arms SuperCollider's own recorder
(`Server.record`), so the WAV is written by the engine itself instead of being
captured off a loopback cable.

A few FoxDot quirks had to be worked around; all of them are documented in the
source:

* `osc/Buffers.scd` ships with absolute `C:/Users/Ryan/...` sample paths, which
  only resolve on the author's Windows machine. They are rewritten to the
  installed package's `snd/` directory, and the 108 entries whose samples no
  longer ship with FoxDot are dropped instead of erroring.
* FoxDot's `Settings` point at `osc/OSCFunc.scd` while the file is actually
  `osc/OscFunc.scd`. That is fine on macOS's case-insensitive filesystem and
  silently missing on Linux, so the lookup is case-insensitive.
* `sclang` is a Qt application, so the image pins `QT_QPA_PLATFORM=offscreen`
  and `QTWEBENGINE_DISABLE_SANDBOX=1` to run it without an X server.
* `Go()` at the end of a piece is the live-coding session's
  `while True: sleep()` loop. It is replaced with a no-op - and on the FoxDot
  module rather than in the exec namespace, because every piece starts with
  `from FoxDot import *` and that would re-bind `Go` straight back.

### Spacial Thanks For
* [FoxDot](https://github.com/Qirky/FoxDot)
* [SuperCollider](https://github.com/supercollider/supercollider)
* [JACK](https://jackaudio.org/) - for a dummy driver that still keeps real time
