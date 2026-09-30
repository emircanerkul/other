---
name: add-project-branch
description: How to onboard a new project branch into the other portal — registry entry, relay workflow, and verification. Use when adding a new project/<name> branch or when the portal shows a project as missing/source-only.
---

# Adding a new project branch to the portal

The portal aggregates every `project/<name>` branch. Three things connect a
branch to the portal: the registry entry, the relay workflow on the branch,
and (optionally) build metadata. Do all three in this order.

## 1. Push the project branch

The branch name MUST start with `project/` — the aggregator discovers
branches by that prefix:

```bash
git push origin <your-branch>:project/<slug>
```

`<slug>` is the branch name without the prefix (e.g. `project/todo-app` →
slug `todo-app`). It must be added to the registry under exactly that slug.

## 2. Register it in scratch/sites.json

Edit `scratch/sites.json` on the **tooling** branch. Add an entry under
`branches` keyed by the slug:

```json
"todo-app": { "title": "Todo App", "mode": "static" }
```

Pick `mode` by what the project is:

| mode | when to use | extra keys |
|---|---|---|
| `static` | plain HTML/JS site at the repo root, or under a conventional dir (`www`, `dist`, `docs`, `public`, `build`) | `entry` (e.g. `"index.html"`, or `"src/index.html"` for a subdirectory docroot) |
| `dir` | site lives in a named subdirectory | `dir` (e.g. `"dashboard"`) |
| `build` | needs a build step (vite/webpack/…) | `build: { "cmd": "npm ci && npm run build", "out": "dist/**" }` |
| `php` | PHP app that should run in the browser playground | `php: { "kind": "plain" \| "symfony", "entry": "index.php" }`; Symfony apps may also set `docroot` and `packed` (see below) |
| `rust` | Rust examples for the wasm playground | none — crates are read from the branch's `examples/` dir |
| `placeholder` | source-only, no runnable output | none |

Notes:
- `title` is the display name on the portal card.
- Omitting the entry entirely = the branch is invisible to the portal.
- `php.kind: "symfony"` apps need a real vendor tree: set
  `packed: "<name>.zip"` and place the zip (with `vendor/`, a seeded SQLite
  db if the app needs one, and a patched `autoload_runtime.php` carrying
  `project_dir`) in `scratch/weather-pack/`. See
  `api-platform-weather-api` in sites.json + weather-pack for the pattern.

## 3. Add the relay workflow to the branch

The branch needs `.github/workflows/relay-sync.yml` so pushes to it trigger
a portal rebuild. Copy `.github/workflows/relay-sync.yml` (identical copy
used to live at `scratch/relay-sync.yml`) into the branch — content is
exactly this:

```yaml
# Relay: pushes to this project branch rebuild the aggregated portal.
# Calls the shared aggregate workflow on tooling (reusable workflow) — no tokens needed.
name: relay-sync
on:
  push:
  workflow_dispatch:
jobs:
  relay:
    uses: emircanerkul/other/.github/workflows/aggregate.yml@tooling
    permissions:
      contents: read
      pages: write
      id-token: write
      actions: read
```

Commit it on the project branch (contents must match byte-for-byte so
future relay updates stay idempotent) and push.

## 4. Verify

1. Push `tooling` (the registry change) — CI run appears in
   github.com/emircanerkul/other/actions ("aggregate").
2. Wait for it to go green; it force-pushes the built bundle to `master`.
3. Check https://emircanerkul.github.io/other/ — the new card must appear
   with the right status (`live` vs `source-only`).
4. If `mode: build` and the build fails, the card shows "build failed" —
   check the CI log of the aggregate run.

## Gotchas

- Branch discovery uses `refs/remotes/origin/project/*` — a branch that
  exists only locally will be reported as "missing from remote".
- The registry is the source of truth for titles/modes; there is no
  per-branch config file to edit.
- The bundle README (landing page) is generated from the registry — never
  hand-edit `README.md` on master.
- Deploy target is `master` (landing page + Pages source). Never commit
  source changes there; they get overwritten by the next deploy.
