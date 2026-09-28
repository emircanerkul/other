# Wallpaper App with Flutter

A Flutter wallpaper app that lists photos from the [Pexels](https://www.pexels.com/)
API, with categories, search and image caching. Runs on mobile (Android/iOS) and
on the web.

## Origin & credits

This project is based on the *"Build a Wallpaper App with Flutter"* tutorial by
**Sanskar Tiwari** ([@theindianappguy](https://github.com/theindianappguy)) —
the original app this repo started from:

- [Watch the full tutorial on YouTube](https://youtu.be/EKdAU3l_0gA)
- [Live demo of the original](https://wallpaperhub.web.app/#/)
- [Sanskar Tiwari on GitHub](https://github.com/theindianappguy) ·
  [LinkedIn](https://www.linkedin.com/in/lamsanskar/) ·
  [YouTube](https://www.youtube.com/c/SanskarTiwari)

### Created & Maintained By

**Sanskar Tiwari** — original app and tutorial
([@theindianappguy](https://github.com/theindianappguy))

**Emircan ERKUL** — this repository: containerized build setup, web
deployment and [dependency fixes](#development)
([emircanerkul](https://github.com/emircanerkul))

## App features

- 100 wallpapers per category, paginated as you scroll
- Category browsing (Street Art, Wild Life, Nature, City, Motivation, Bikes, Cars)
- Keyword search
- Image caching on mobile (`cached_network_image`)
- Firebase ("wallpaperhub" project) from the original tutorial
- Web support: `kIsWeb` code paths, PWA service worker, "set wallpaper" opens
  the full-size image in a new tab (native gallery saving is mobile-only)

## Configuration: Pexels API key

The app calls the Pexels API. The key is **not** committed; it is injected at
build time:

```bash
./deploy/flutter-run.sh bash -lc \
  'flutter build web --release --pwa-strategy=none \
   --dart-define=PEXELS_API_KEY=<your-key>'
```

`lib/data/data.dart` reads it via `String.fromEnvironment` and falls back to a
placeholder (the app then loads but the API returns 401 and no wallpapers show).

## Development

The project is a 2019/2020-era app (`environment: sdk: ">=2.1.0 <3.0.0"`,
pre-null-safety dependencies). Dependencies are pinned to that era; only three
**transitive** deps are overridden (`dependency_overrides` in `pubspec.yaml`)
because their resolved versions no longer compile under Dart 2.19.

Everything builds inside a container — no Flutter/Dart install needed on the
host. See **[deploy/README.md](deploy/README.md)** for the full setup:

```bash
source container-env.sh
podman build -f deploy/Dockerfile -t wallpaper-flutter:3.7.7-arm64 deploy/
./deploy/flutter-run.sh bash -lc 'flutter pub get && flutter build web --release --pwa-strategy=none'
docker compose up -d web   # http://localhost:8080
```

## Repository history

Three commits, all from 2021-01-17: the app was imported into this repo
wholesale (`init`), followed by `readme` and `gitignore`. For licensing
transparency: the original README (with the author's copyright and Apache 2.0
license) was replaced by commit
[`84df4f9`](https://github.com/emircanerkul/wallpaper/commit/84df4f93f6bb8324eb6131e947ccc3253c880e3c).
This README and the [LICENSE](LICENSE) file restore that attribution and extend
the license with the current maintainer's copyright.

## License

```
Copyright 2020 Sanskar Tiwari
Copyright 2021 Emircan ERKUL
```

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at [apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0).
The full text is in [LICENSE](LICENSE). Unless required by applicable law or
agreed to in writing, software distributed under the License is distributed on
an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
