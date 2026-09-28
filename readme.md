## I make Music with Python FoxDot & SuperCollider

Pieces live-coded in [FoxDot](https://github.com/Qirky/FoxDot), played by the
[SuperCollider](https://github.com/supercollider/supercollider) engine. The audio
in this repository is rendered headlessly in Docker — no sound card, no screen
recording.

| Piece | Code | Listen | SoundCloud |
| :--- | :---: | :---: | :---: |
| **Almost Done** | [almost_done.py](pieces/almost_done.py) | [mp3](audio/almost_done.mp3?raw=true) · [ogg](audio/almost_done.ogg?raw=true) | [listen](https://soundcloud.com/emircanerkul/almost-done) |
| **Insist** | [insist.py](pieces/insist.py) | [mp3](audio/insist.mp3?raw=true) · [ogg](audio/insist.ogg?raw=true) | [listen](https://soundcloud.com/emircanerkul/insist) |

16 bars / 32 s each, 120 BPM in 4/4. The WAV masters are `gitignore`d — they are
regenerated in a minute.

### Web player

[`www/index.html`](www/index.html) is a real player page: `<audio controls>`, a
playlist, track switching and the FoxDot source for each piece, with no
dependencies. Serve the folder and open it:

```bash
python3 -m http.server -d www 8000    # then open http://localhost:8000
```

It cannot be *inlined* in this README: GitHub strips `<audio>` tags from Markdown
and serves `.html` from `raw.githubusercontent.com` as `text/plain`. The page is
wired to this repo's Pages aggregator (the `www/` convention), so switching the
branch from `archive` to `static` in `scratch/sites.json` on `main` publishes it
under `/foxdot-music-synthesis/`.

### Render it yourself

```bash
./render.sh                      # every piece in pieces/ -> ./audio
./render.sh pieces/insist.py     # just one
```

Docker only — the image bundles SuperCollider and JACK's dummy driver, which is a
real-time paced virtual sound card. Useful flags: `--bars`, `--fade-out`,
`--mp3-bitrate` (default `96k`), `--formats`. See [render.py](render.py).

### Spacial Thanks For

[FoxDot](https://github.com/Qirky/FoxDot) ·
[SuperCollider](https://github.com/supercollider/supercollider) ·
[JACK](https://jackaudio.org/)
