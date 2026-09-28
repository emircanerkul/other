## I make Music with Python FoxDot & SuperCollider

Pieces live-coded in [FoxDot](https://github.com/Qirky/FoxDot), played by the
[SuperCollider](https://github.com/supercollider/supercollider) engine. The audio
in this repository is rendered headlessly in Docker — no sound card, no screen
recording.

| Piece | Code | Listen | SoundCloud |
| :--- | :---: | :---: | :---: |
| **Almost Done** | [almost_done.py](pieces/almost_done.py) | [listen](audio/almost_done.webm?raw=true) · [mp3](audio/almost_done.mp3?raw=true) | [listen](https://soundcloud.com/emircanerkul/almost-done) |
| **Insist** | [insist.py](pieces/insist.py) | [listen](audio/insist.webm?raw=true) · [mp3](audio/insist.mp3?raw=true) | [listen](https://soundcloud.com/emircanerkul/insist) |

16 bars / 32 s each, 120 BPM in 4/4. The WAV masters are `gitignore`d — they are
regenerated in a minute.

**Open the `listen` link and it plays in the browser.** That is the WebM talking:
`raw.githubusercontent.com` serves `.webm` as `video/webm`, which every browser
hands to its built-in player. The `.mp3` next to it is the fallback for anything
older — GitHub serves it as `audio/mpeg`, which Firefox and Safari play inline
but Chrome downloads.

### Can a README embed a player?

No, and it is worth being precise about why, because "just use an audio tag" is
the wrong answer twice over:

* GitHub strips `<audio>` from Markdown, and strips `src` from `<video>` too —
  its allowlist allows `source` with only `srcset`.
* GitHub *does* support video, but only for files **uploaded as attachments**. A
  `<video>` tag or a bare link pointing at a file in the repo renders as a plain
  link. (An `.mp4` in the repo comes back as `application/octet-stream`, so even a
  browser that gets that far only downloads it.)

That is why the links above go straight to the files rather than through a
player. Verified against this repository, not just the docs.

### Render it yourself

```bash
./render.sh                      # every piece in pieces/ -> ./audio
./render.sh pieces/insist.py     # just one
```

Docker only — the image bundles SuperCollider and JACK's dummy driver, which is a
real-time paced virtual sound card. Useful flags: `--bars` (default 16),
`--fade-out`, `--mp3-bitrate` (default `96k`), `--formats` (`wav,mp3,webm`).
See [render.py](render.py).

### Spacial Thanks For

[FoxDot](https://github.com/Qirky/FoxDot) ·
[SuperCollider](https://github.com/supercollider/supercollider) ·
[JACK](https://jackaudio.org/)
