## I make Music with Python FoxDot & SuperCollider

Pieces live-coded in [FoxDot](https://github.com/Qirky/FoxDot), played by the
[SuperCollider](https://github.com/supercollider/supercollider) engine and
rendered headlessly in Docker — no sound card involved.

| Piece | Code | Listen |
| :--- | :---: | :--- |
| **Almost Done** | [almost_done.py](pieces/almost_done.py) | [webm](https://github.com/emircanerkul/other/raw/refs/heads/project/foxdot-music-synthesis/audio/almost_done.webm) · [mp3](https://github.com/emircanerkul/other/raw/refs/heads/project/foxdot-music-synthesis/audio/almost_done.mp3) · [soundcloud](https://soundcloud.com/emircanerkul/almost-done) |
| **Insist** | [insist.py](pieces/insist.py) | [webm](https://github.com/emircanerkul/other/raw/refs/heads/project/foxdot-music-synthesis/audio/insist.webm) · [mp3](https://github.com/emircanerkul/other/raw/refs/heads/project/foxdot-music-synthesis/audio/insist.mp3) · [soundcloud](https://soundcloud.com/emircanerkul/insist) |
| **Stepfun5 AI's Taste** | [stepfun5_ais_taste.py](pieces/stepfun5_ais_taste.py) | [webm](https://github.com/emircanerkul/other/raw/refs/heads/project/foxdot-music-synthesis/audio/stepfun5_ais_taste.webm) · [mp3](https://github.com/emircanerkul/other/raw/refs/heads/project/foxdot-music-synthesis/audio/stepfun5_ais_taste.mp3) |

16 bars / 32 s each, 120 BPM in 4/4. The **webm** link is the one to click: GitHub
serves it as `audio/webm`, so the browser plays it. The **mp3** is the fallback for
older browsers — Chrome downloads it instead of playing it, because Chrome has no
inline player for `audio/mpeg` on navigation. WAV masters are regenerated, not
committed.

### Render it yourself

```bash
./render.sh                      # every piece in pieces/ -> ./audio
./render.sh pieces/insist.py     # just one
```

Docker only — the image bundles SuperCollider and JACK's dummy driver. Flags
worth knowing: `--bars` (16), `--fade-out`, `--mp3-bitrate` (96k), `--formats`
(`wav,mp3,webm`).

### Thanks

[FoxDot](https://github.com/Qirky/FoxDot) ·
[SuperCollider](https://github.com/supercollider/supercollider) ·
[JACK](https://jackaudio.org/)
