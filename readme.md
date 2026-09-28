## I make Music with Python FoxDot & SuperCollider

Pieces live-coded in [FoxDot](https://github.com/Qirky/FoxDot), played by the
[SuperCollider](https://github.com/supercollider/supercollider) engine and
rendered headlessly in Docker — no sound card involved.

| Piece | Code | Listen | SoundCloud |
| :--- | :---: | :---: | :---: |
| **Almost Done** | [almost_done.py](pieces/almost_done.py) | [webm](audio/almost_done.webm?raw=true) · [mp3](audio/almost_done.mp3?raw=true) | [listen](https://soundcloud.com/emircanerkul/almost-done) |
| **Insist** | [insist.py](pieces/insist.py) | [webm](audio/insist.webm?raw=true) · [mp3](audio/insist.mp3?raw=true) | [listen](https://soundcloud.com/emircanerkul/insist) |

16 bars / 32 s each, 120 BPM in 4/4. The webm links play in the browser; the mp3s
are there for older ones. WAV masters are regenerated, not committed.

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
