# [Personal Web Page](https://github.com/emircanerkul/personal-web-page/archive/master.zip)

My personal website — a static, hand-written HTML/CSS/JS site (the 2019 version of emircanerkul.com).

Live: https://emircanerkul.com/

## Features

- Bilingual content: English (`/about/`) and Turkish (`/hakkimda/`)
- Blog with posts in both languages
- Project portfolio
- Lightbox image gallery (`wa-mediabox`)
- Cookie consent banner

## Tech

Plain HTML, CSS, and vanilla JavaScript — no build step and no dependencies.

## Running locally

Any static file server works. Asset paths are root-absolute, so the repo directory must be served as the web root:

```sh
python3 -m http.server 1314
```

Then open http://127.0.0.1:1314/
