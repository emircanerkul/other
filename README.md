# other — portal tooling

Build pipeline for the **other** multi-project portal: every `project/<name>`
branch is aggregated into a static bundle and published to
**https://emircanerkul.github.io/other/** — no server, no tokens.

## Layout

| Path | What it is |
|---|---|
| `scratch/aggregate.mjs` | the aggregator — extracts every `project/*` branch, builds static sites, the browser PHP playground (php-wasm, dual 7.4/8.1 runtimes, packed apps) and the Rust wasm playground |
| `scratch/sites.json` | the project registry — one entry per branch (title, mode, entry point) |
| `scratch/build-phpwasm.mjs` | bundles the WebAssembly PHP runtimes (7.4 + 8.1) with esbuild |
| `scratch/phpwasm-entry.mjs` | browser boot shim for the wasm PHP runtime |
| `scratch/empty-stub.mjs` | esbuild alias stubbing unused php-wasm runtime variants |
| `scratch/nojspi-stub.mjs` | esbuild alias forcing the asyncify wasm variant |
| `scratch/playground-src/` | PHP playground UI (lazy-loading, service-worker cached) |
| `scratch/rust-playground-src/` | Rust playground UI (per-example runner via `EXAMPLE_NO`) |
| `.github/workflows/aggregate.yml` | the reusable CI workflow — relays on `project/*` branches call it |
| `.github/workflows/relay-sync.yml` | the relay stamped onto every `project/*` branch |
| `.skills/add-project-branch/` | agent skill: how to onboard a new project branch |

## Branch roles

- **`tooling`** (this branch) — all development happens here. Single squashed commit.
- **`master`** — generated bundle only: the repo landing page (README + browsable portal) **and** the GitHub Pages source. Never commit source changes here; the next deploy overwrites them.
- **`project/<name>`** — one branch per project, each carrying `relay-sync.yml` so pushes trigger a rebuild.

## How a deploy works

1. Push to `tooling` (or any `project/*` branch — its relay calls the shared workflow).
2. `aggregate.yml` checks out `tooling`, fetches all `project/*` branches, runs the aggregator.
3. The built bundle is force-pushed to `master`. Pages serves it.
4. Large packed apps (e.g. the Symfony weather API's vendor+SQLite zip) are not stored in git — the aggregator fetches them from the last deployed bundle on master and caches them locally in `scratch/packs/`.

## Local build

```bash
npm install
node scratch/aggregate.mjs --with-builds --with-php   # full bundle → sites/
npx serve sites                                       # or any static server
```

The Rust playground build additionally needs `rustup target add
wasm32-unknown-emscripten` and the [emsdk](https://emscripten.org) toolchain.

## Adding a project

See [`.skills/add-project-branch/SKILL.md`](.skills/add-project-branch/SKILL.md).
