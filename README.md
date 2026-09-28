# ELITE GAMERS

Static blog and website for **elitegamers.net**, built with [VuePress](https://v0.vuepress.vuejs.org/) and a custom [ktquez](https://github.com/ktquez/vuepress-theme-ktquez) based theme.

![Preview](preview.webp)

## Overview

The site publishes gaming news, free-game roundups, cloud-gaming and game-development
articles. Content lives in Markdown, the theme is maintained in-repo under
`src/.vuepress/theme`, and everything compiles to static HTML.

- **Posts** — 35 articles with cover images, reading time, categories and tags
- **Categories** — cloud gaming, development, free games, game development, game,
  learning, news and technology
- **Pages** — contact and privacy-policy
- **Theme** — customised fork of `vuepress-theme-ktquez` with its own components,
  layouts and translation strings

## Features

Provided by the bundled theme:

- Night (dark) mode toggle
- Client-side search
- Post covers as responsive images, generated at multiple widths
- Sitemap generation as a `postbuild` step
- Service worker for offline/caching support
- Google Analytics (`G-0VR3Q1WH8K`)
- Newsletter and ad slots
- Multi-language support through the theme translation plugin

## Tech stack

| | |
|---|---|
| Generator | VuePress `0.14.x` |
| Front end | Vue 2 (theme and components) |
| Theme | `elitegamers-net-vuepress-theme-ktquez` `0.2.18`, in-repo |
| Images | [`resize-img`](https://github.com/karmux/resize-img) for responsive variants |
| Deployment | static output to GitHub Pages |

## Project structure

```
src/
  index.md                          home page
  posts/                            35 articles, one folder each with a README.md
    gta-trilogy-criticized/
      README.md                     article + frontmatter
  categories/                       category landing pages (8)
  contact/                          contact page
  privacy-policy/                   privacy page
  .vuepress/
    config.js                       site config
    config/
      head.js                       meta, Open Graph, Twitter, favicons
      themeConfig.js                theme-level options
      locales/en/                   English copy and ads
    public/                         favicons, logos, images/posts
    theme/                          the theme itself
      Layout.vue                    app shell
      views/                        Home, Posts, Post, Categories, Category, Page
      layouts/                      Base, Page, Post
      components/                   Header, Footer, Search, CardPost, Newsletter, ...
      plugins/Translation/locales/  translation strings
resizer.js                          generates responsive image variants
```

## Getting started

Requires Node.js. The repository pins its dependency tree with both
`package-lock.json` and `yarn.lock`.

```bash
# install site dependencies plus the theme's own dependencies
npm ci
npm --prefix src/.vuepress/theme install src/.vuepress/theme
```

### Development server

```bash
npm run dev          # vuepress dev src, default port 8080
```

### Production build

```bash
npm run build        # prebuild installs the theme, then vuepress build src
```

`postbuild` automatically generates a sitemap for `https://elitegamers.net`, so the
output is in `src/.vuepress/dist`.

### Node 17 or newer

VuePress `0.14` builds with webpack 4, which uses the OpenSSL `md4` hash. On
Node 17+ that algorithm is unavailable, and the build fails with
`ERR_OSSL_EVP_UNSUPPORTED`. Either use Node 16, or enable the legacy provider:

```bash
NODE_OPTIONS=--openssl-legacy-provider npm run build
```

## Writing a post

Create `src/posts/<slug>/README.md` with frontmatter. The `slug` and `created_at`
fields are what the URL and post date come from:

```yaml
---
view: post
layout: post
lang: en
author: emircanerkul
title: GTA trilogy criticized
description: "Short summary used in meta description and previews."
excerpt:
featured: false
cover: false            # set true once a cover image is added
coverAlt:
demo:
slug: gta-trilogy-criticized
categories:
  - news
tags:
  - news
created_at: 2021-11-14 12:00
updated_at: 2021-11-14 12:00
sitemap:
---

Article body in Markdown.
```

To register a new category, add a folder under `src/categories/<category-slug>/`
with an `index.md`.

## Adding post cover images

Drop originals into `src/.vuepress/public/images/posts` and run:

```bash
npm run resizer
```

This writes `name,w_<width>.ext` variants at 200, 500, 768, 800, 1024 and 1366
pixels so the theme can pick a responsive source.

## The theme

The theme is a maintained fork of `vuepress-theme-ktquez`, vendored at
`src/.vuepress/theme` and depended on via `file:` in `package.json`:

```json
"elitegamers-net-vuepress-theme-ktquez": "file:src/.vuepress/theme"
```

Because it is a local dependency, changes to the theme need its own
`npm --prefix src/.vuepress/theme install src/.vuepress/theme`
(or run `npm run build`, which does it through `prebuild`) before a build.

## Deployment

The build output in `src/.vuepress/dist` is plain static HTML, JS, CSS and images,
and is served from the site root (`base: "/"`). It can be published to any static
host — the theme ships a `manifest.json`, service worker, `robots.txt` and
`browserconfig.xml`.
