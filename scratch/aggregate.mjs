#!/usr/bin/env node
/**
 * aggregate.mjs — builds the static `sites/` bundle from all project/* branches.
 *
 * Modes (scratch/sites.json):
 *   static      — copy convention dir (www|dist|docs|public|build with index.html, else root)
 *   dir         — copy an explicit directory (e.g. dashboard)
 *   build       — run a build command inside the branch tree, copy its output
 *   archive     — deprecated: treated as placeholder (no zip produced)
 *   placeholder — no artifact; card links to GitHub
 *
 * Flags:
 *   --with-builds   run build-mode branches (CI does; skipped otherwise)
 *   --with-php      assemble + bundle the browser php-wasm playground
 *   --source <dir>  use pre-extracted branch trees (<dir>/<slug>) instead of git archive
 *   --out <dir>     output directory (default: sites)
 */
import {
  existsSync, mkdirSync, rmSync, readFileSync, writeFileSync,
  readdirSync, statSync, cpSync, copyFileSync,
} from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, def) => {
  const i = argv.indexOf(`--${name}=`);
  return i >= 0 ? argv[i].split('=').slice(1).join('=') : def;
};

const WITH_BUILDS = flag('with-builds');
const ONLY = opt('only', null)?.split(',').filter(Boolean) ?? null;
const WITH_PHP = flag('with-php');
const OUT = resolve(ROOT, opt('out', 'sites'));
const SOURCE = opt('source', null);
const registry = JSON.parse(readFileSync(join(ROOT, 'scratch/sites.json'), 'utf8'));
const PREFIX = registry.branchPrefix;
const REPO_SLUG = process.env.GITHUB_REPOSITORY || 'emircanerkul/other';
const BRANCH_URL = (slug) => `https://github.com/${REPO_SLUG}/tree/${PREFIX}${slug}`;

/* ---------------------------------------------------------------- helpers */
const walk = (dir, base = dir, acc = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, base, acc);
    else acc.push(p.slice(base.length + 1).replaceAll('\\', '/'));
  }
  return acc;
};

/** rewrite absolute URLs so sites work under /<slug>/ subpaths */
function buildRustPlayground(OUT, SRC) {
  const RP = join(OUT, 'rust-playground');
  mkdirSync(RP, { recursive: true });
  const src = join(ROOT, 'scratch/rust-playground-src');
  if (existsSync(src)) cpSync(src, RP, { recursive: true });
  // example crates come from the project/rust-first-step branch tree (SRC),
  // not from a copy on tooling — the branch is the single source of truth
  const exRoot = join(SRC, 'rust-first-step', 'examples');
  if (!existsSync(exRoot)) { console.log('⚠ rust playground: no examples on the branch — skipped'); return; }
  const RUSTENV = { ...process.env, PATH: `${process.env.HOME}/.cargo/bin:${process.env.PATH}` };
  const RUSTCMD = 'export PATH=' + JSON.stringify(RUSTENV.PATH) + ':$PATH; source /tmp/emsdk/emsdk_env.sh >/dev/null 2>&1;';
  const hasToolchain = (() => {
    try {
      execSync(RUSTCMD + ' emcc --version >/dev/null && cargo --version >/dev/null', { stdio: 'ignore', shell: '/bin/bash' });
      return true;
    } catch { return false; }
  })();
  const list = [];
  for (const dir of readdirSync(exRoot).sort()) {
    const crate = join(exRoot, dir);
    if (!statSync(crate).isDirectory()) continue;
    const title = dir.replace(/_/g, ' ').replace('example ', 'Example ').replace(/^example /, 'Example ');
    if (!hasToolchain) {
      // no toolchain — still list it, linked to source
      list.push({ slug: dir, title: title.charAt(0).toUpperCase() + title.slice(1), built: false });
      continue;
    }
    try {
      execSync(RUSTCMD + ' cargo build --target wasm32-unknown-emscripten --release', { cwd: crate, stdio: 'inherit', shell: '/bin/bash' });
      const out = join(crate, 'target/wasm32-unknown-emscripten/release');
      const js = readdirSync(out).find(f => f === `${dir}.js`);
      const wasm = readdirSync(out).find(f => f === `${dir}.wasm`);
      mkdirSync(join(RP, 'examples'), { recursive: true });
      if (js) copyFileSync(join(out, js), join(RP, 'examples', js));
      if (wasm) copyFileSync(join(out, wasm), join(RP, 'examples', wasm));
      list.push({ slug: dir, title: title.charAt(0).toUpperCase() + title.slice(1), built: true });
    } catch (e) {
      console.log(`⚠ rust example ${dir}: build failed — ${String(e.message).slice(0, 120)}`);
      list.push({ slug: dir, title: title.charAt(0).toUpperCase() + title.slice(1), built: false });
    }
  }
  writeFileSync(join(RP, 'examples.json'), JSON.stringify(list, null, 1));
  console.log(`✓ rust playground → ${RP} (${list.filter(a => a.built).length}/${list.length} examples built)`);
}
function rewriteAbsolute(dir, slug = '', phpRooted = false) {
  let count = 0;
  const rewrite = (file, re, rep) => {
    const src = readFileSync(file, 'utf8');
    const out = src.replace(re, rep);
    if (out !== src) { writeFileSync(file, out); count++; }
  };
  // builds that bake their own name into absolute URLs (vite base '/ipd/' →
  // "/ipd/assets/x.js") must LOSE the prefix — the app is already deployed
  // at /<OUT>/<slug>/, so keeping it doubles the path (ipd/ipd/… 404s)
  const stripSlug = slug
    ? [
        [new RegExp(`\\b(src|href|poster|action)=(["'])/${slug}/`, 'g'), `$1=$2./`],
        [new RegExp(`url\\(\\s*(['"]?)/${slug}/`, 'g'), 'url($1./'],
      ]
    : [];
  for (const rel of walk(dir)) {
    const p = join(dir, rel);
    if (rel.endsWith('.html') || rel.endsWith('.xhtml')) {
      for (const [re, rep] of stripSlug) rewrite(p, re, rep);
      // absolute URLs must be resolved relative to the APP ROOT, not the
      // file — a subpage like portfolio/index.html referencing /css/x.css
      // needs ../css/, only root html gets ./
      // php apps include templates into root-level pages, so their html
      // must always resolve against the app root — never ../
      const depth = phpRooted ? 0 : rel.split('/').slice(0, -1).length;
      const htmlPrefix = depth === 0 ? './' : '../'.repeat(depth);
      rewrite(p, new RegExp(`\\b(src|href|poster|action|srcset)=((?:"|'))\\/`, 'g'), `$1=$2${htmlPrefix}`);
      // srcset values are "url descriptor, url descriptor" pairs — the plain
      // attribute rule above only rewrites the leading URL
      rewrite(p, /(srcset=["'])([^"']+)/g, (m, a, v) => a + v.replace(/(^|[\s,])\//g, `$1${htmlPrefix}`));
      rewrite(p, /url\(\s*(['"]?)\/(?!\/)/g, `url($1${htmlPrefix}`);
      rewrite(p, /url\((['"]?)\/\/?/g, 'url($1/'); // normalize double-slash artefacts
    } else if (rel.endsWith('.css')) {
      for (const [re, rep] of stripSlug) rewrite(p, re, rep);
      // url() is relative to the CSS FILE's directory, not the app root —
      // /assets/x.css referencing /fonts/y.woff must become ../fonts/, and
      // only refs from the app-root css dir get plain ./
      const depth = rel.split('/').slice(0, -1).length;
      const cssPrefix = depth === 0 ? './' : '../'.repeat(depth);
      rewrite(p, /url\(\s*(['"]?)\/(?!\/)/g, `url($1${cssPrefix}`);
    } else if (rel.endsWith('.js') && /(^|\/)assets\/js\//.test(rel)) {
      // VuePress bundles set webpack publicPath to '/' — under a Pages
      // subpath every lazy chunk then resolves to the site root. Rewrite
      // the runtime to a relative public path.
      rewrite(p, /\.p\s*=\s*['"]\/['"]/g, '.p="./"');
      // bundled Vue data also hardcodes root-absolute STATIC asset paths
      // (e.g. the 404 page image "/abduction.svg"). Only rewrite paths that
      // exist as files in the app dir — route strings are left alone.
      rewrite(p, /"\/([a-zA-Z0-9_.-]+\.(?:png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|mp3|mp4))"/g, (m, file) =>
        existsSync(join(dir, file)) ? `"./${file}"` : m);
      // Vue templates build asset URLs at runtime: src:`/${x.y}` and
      // srcset:`/${x.y} 1x, /${x}@2x.z` — make the leading slash relative
      rewrite(p, /src:`\/\$/g, 'src:`./$');
      rewrite(p, /(srcset:`)\/\$/g, '$1./$$');
      rewrite(p, /(srcset:`[^`]*? 1x, )\/\$/g, '$1./$$');
    } else if (rel === 'manifest.json' || rel === 'service-worker.js') {
      // VuePress PWA files hardcode site-root paths — they only work when
      // the app is served from a subpath if every '/' path is made relative
      rewrite(p, /"(start_url|src|url)":\s*"\//g, '"$1": "./');
      rewrite(p, /"\//g, '"./');
      rewrite(p, /'\/([a-zA-Z_.][^']*)'/g, "'./$1'"); // single-quoted paths (precache entries)
    }
  }
  return count;
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};



/* ------------------------------------------------------- branch tree prep */
const branchRefs = execSync(`git for-each-ref --format='%(refname:short)' 'refs/remotes/${registry.branchSource}/${PREFIX}*'`, { cwd: ROOT })
  .toString().trim().split('\n')
  .map((r) => r.replace(`${registry.branchSource}/`, ''));
const slugs = Object.keys(registry.branches)
  .filter((s) => branchRefs.includes(`${PREFIX}${s}`))
  .filter((s) => !ONLY || ONLY.includes(s));
const missing = Object.keys(registry.branches).filter((s) => !branchRefs.includes(`${PREFIX}${s}`));
if (missing.length) console.warn(`⚠ branches missing from remote: ${missing.join(', ')}`);

let SRC = SOURCE ? resolve(SOURCE) : join(ROOT, '.work/branches');
if (!SOURCE) {
  rmSync(SRC, { recursive: true, force: true, maxRetries: 10 });
  mkdirSync(SRC, { recursive: true });
  for (const slug of slugs) {
    const dst = join(SRC, slug);
    mkdirSync(dst, { recursive: true });
    execSync(`git archive "${registry.branchSource}/${PREFIX}${slug}" | tar -x -C "${dst}"`, { cwd: ROOT, stdio: 'pipe' });
  }
  console.log(`✓ extracted ${slugs.length} branch trees → ${SRC}`);
}

/* --------------------------------------------------------------- artifact */
rmSync(OUT, { recursive: true, force: true, maxRetries: 10 });
mkdirSync(OUT, { recursive: true });

const apps = [];
let liveCount = 0, placeholderCount = 0, buildFailed = 0;

const writePlaceholder = (slug, title, status) => {
  mkdirSync(join(OUT, slug), { recursive: true });
  writeFileSync(join(OUT, slug, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<meta http-equiv="refresh" content="0;url=${BRANCH_URL(slug)}"></head>
<body style="font-family:system-ui;padding:2rem">
<p>This project ships no static web output.</p>
<p>Redirecting to <a href="${BRANCH_URL(slug)}">the GitHub branch</a>…</p>
</body></html>`);
};

for (const slug of slugs) {
  const cfg = registry.branches[slug];
  const tree = join(SRC, slug);
  const title = cfg.title ?? slug;
  const card = { slug, title, branch: `${PREFIX}${slug}`, status: 'placeholder', branchUrl: BRANCH_URL(slug) };

  if (cfg.mode === 'static' || cfg.mode === 'dir') {
    let root = null;
    if (cfg.mode === 'dir') root = cfg.dir;
    else if (cfg.entry) root = cfg.entry.includes('/') ? dirname(cfg.entry) : '';
    else {
      for (const c of ['www', 'dist', 'docs', 'public', 'build']) {
        if (existsSync(join(tree, c, 'index.html'))) { root = c; break; }
      }
      if (root === null && existsSync(join(tree, 'index.html'))) root = '';
    }
    if (root === null) {
      console.warn(`⚠ ${slug}: static mode but no convention entry — placeholder`);
      writePlaceholder(slug, title);
      placeholderCount++; card.status = 'placeholder';
    } else {
      const srcDir = root ? join(tree, root) : tree;
      cpSync(srcDir, join(OUT, slug), { recursive: true, filter: (s) => !/(^|\/)\.git($|\/)/.test(s) });
      const rewritten = rewriteAbsolute(join(OUT, slug), slug);
      const entryRel = cfg.entry ? cfg.entry.replace(root ? `${root}/` : '', '') : 'index.html';
      card.status = 'live'; card.url = `./${slug}/${entryRel}`;
      liveCount++;
      console.log(`✓ ${slug}: ${root || '.'} → /${slug}/ (${rewritten} files rewritten)`);
    }
  } else if (cfg.mode === 'rust') {
    // the wasm playground is built by buildRustPlayground(); the card links
    // straight into it with the example list
    card.status = 'live';
    card.url = './rust-playground/';
    card.rust = true;
    liveCount++;
    console.log(`✓ ${slug}: wasm playground → /rust-playground/`);
  } else if (cfg.mode === 'build') {
    if (WITH_BUILDS) {
      console.log(`🔨 ${slug}: ${cfg.build.cmd}`);
      const r = spawnSync(cfg.build.cmd, { cwd: tree, shell: true, stdio: 'inherit', timeout: 15 * 60_000 });
      const out = cfg.build.out.replace('/**', '');
      const outDir = join(tree, out);
      if (r.status === 0 && existsSync(outDir)) {
        cpSync(outDir, join(OUT, slug), { recursive: true });
        rewriteAbsolute(join(OUT, slug), slug);
        card.status = 'live'; card.url = `./${slug}/`; liveCount++;
        console.log(`✓ ${slug}: build output ${cfg.build.out} → /${slug}/`);
      } else {
        buildFailed++;
        console.warn(`⚠ ${slug}: build failed (exit ${r.status}) — placeholder`);
        writePlaceholder(slug, title);
        card.status = 'build-failed';
      }
    } else {
      writePlaceholder(slug, title);
      card.status = 'placeholder'; placeholderCount++;
      console.log(`○ ${slug}: build skipped (no --with-builds)`);
    }
  } else if (cfg.mode === 'archive') {
    // archive mode deprecated — no zipping (CPU/wasted bytes); link to the branch
    writePlaceholder(slug, title);
    placeholderCount++;
    console.log(`○ ${slug}: archive mode disabled — placeholder (branch: ${PREFIX}${slug})`);
  } else {
    writePlaceholder(slug, title);
    placeholderCount++;
  }

  if (cfg.php) card.php = { kind: cfg.php.kind, entry: cfg.php.entry };
  apps.push(card);
}

/* ------------------------------------------------------- php playground */
if (WITH_PHP && registry.phpPlayground?.enabled) {
  const PG = join(OUT, 'php-playground');
  mkdirSync(join(PG, 'apps'), { recursive: true });
  const phpApps = [];
  for (const slug of slugs) {
    const cfg = registry.branches[slug];
    if (!cfg.php) continue;
    const tree = join(SRC, slug);
    const appDir = join(PG, 'apps', slug);
    mkdirSync(appDir, { recursive: true });
    const symfony = cfg.php.kind === 'symfony';
    // symfony apps need vendor/ + a database — ship a slim tree, label experimental
    // dir-mode / entry-in-subdir apps: the docroot of the app is the SUBDIR
    // (relative URLs in the app's pages resolve against it), so copy that
    // directory as the app root and strip the subdir from the entry.
    // php apps may declare their own docroot (api-platform lives under api/)
    const sub = cfg.php?.docroot || (cfg.mode === 'dir' && cfg.dir
      ? cfg.dir
      : (cfg.mode === 'static' && cfg.entry?.includes('/') ? dirname(cfg.entry) : ''));
    // paths are tested relative to the docroot, so a docroot named 'api'
    // doesn't trip the 'api' skip rule for everything beneath it
    const srcTree = sub ? join(tree, sub) : tree;
    const skip = (s) => {
      if (s === srcTree) return false; // never skip the copy root itself
      const rel = sub && s.startsWith(tree + '/') ? s.slice(tree.length + 1).replace(sub + '/', '') : s;
      return /(^|\/)(\.git|vendor|var|node_modules|bin|migrations|translations|config|packages|helm|api|docker)(\/|$)/.test(rel)
        || /\.lock$/.test(rel) || /(^|\/)composer\.(json|lock)$/.test(rel);
    };
    // entry stays docroot-relative (public/index.php), not basename —
    // the php handler resolves it against the app docroot
    const entry = cfg.php?.docroot ? cfg.php.entry.replace(/^\.\//, '')
      : sub ? basename(cfg.php.entry || 'index.html') : cfg.php.entry;
    if (cfg.packed) {
      // heavy apps ship as a single zip the runtime extracts on first use
      // (per-file fetching of thousands of vendor files would be too slow).
      // The pack itself is NOT stored on tooling (too big for git) — it is
      // fetched from the last deployed bundle on master and cached locally.
      const packDir = join(ROOT, 'scratch/packs');
      const packSrc = join(packDir, cfg.packed);
      if (!existsSync(packSrc)) {
        const url = `https://raw.githubusercontent.com/${REPO_SLUG}/master/php-playground/apps/${slug}/${cfg.packed}`;
        console.log(`⬇ ${slug}: fetching ${cfg.packed} from the deployed bundle…`);
        mkdirSync(packDir, { recursive: true });
        execSync(`curl -fsSL --retry 3 -o '${packSrc}' '${url}'`, { stdio: 'inherit' });
      }
      mkdirSync(appDir, { recursive: true });
      copyFileSync(packSrc, join(appDir, cfg.packed));
      writeFileSync(join(appDir, 'manifest.json'), JSON.stringify([cfg.packed, 'bootstrap.php']));
      writeFileSync(join(appDir, 'bootstrap.php'), `<?php
$zip = new ZipArchive();
if ($zip->open(__DIR__ . '/${cfg.packed}') === true) {
  // extractTo does not reliably overwrite pre-existing files in this
  // runtime — wipe the tree first so every deploy starts clean
  foreach ([__DIR__ . '/vendor', __DIR__ . '/config', __DIR__ . '/src', __DIR__ . '/public', __DIR__ . '/migrations', __DIR__ . '/translations', __DIR__ . '/templates', __DIR__ . '/var'] as $d) {
    if (is_dir($d)) { $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($d, FilesystemIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST); foreach ($it as $f) { $f->isDir() ? rmdir($f) : unlink($f); } rmdir($d); }
  }
  $zip->extractTo(__DIR__);
  $zip->close();
  echo "extracted";
}
`);
      phpApps.push({ slug, kind: cfg.php.kind, entry, title: cfg.title ?? slug, packed: cfg.packed });
      console.log(`✓ php playground app: ${slug} (packed: ${cfg.packed})`);
    } else {
    cpSync(srcTree, appDir, { recursive: true, filter: (s) => !(symfony && skip(s)) && !/(^|\/)\.github(\/|$)/.test(s) });
    // php-rendered templates (.xhtml etc.) can hardcode site-root URLs —
    // apply the subpath rewrites; templates are included into root-level
    // pages, so html refs resolve against the app root
    rewriteAbsolute(appDir, slug, true);
    const files = walk(appDir);
    writeFileSync(join(appDir, 'manifest.json'), JSON.stringify(files));
    phpApps.push({ slug, kind: cfg.php.kind, entry, title: cfg.title ?? slug });
    console.log(`✓ php playground app: ${slug} (${files.length} files${symfony ? ', experimental' : ''})`);
    }
  }
  writeFileSync(join(PG, 'apps.json'), JSON.stringify(phpApps));
  // bundle the runtime first — the playground UI is copied after, so the
  // bundler's .js→.mjs rename pass can't touch sw.js
  execSync('node scratch/build-phpwasm.mjs', { cwd: ROOT, stdio: 'inherit' });
  buildRustPlayground(OUT, SRC);
  cpSync(join(ROOT, 'scratch/playground-src'), PG, { recursive: true });
  console.log(`✓ php playground → ${PG} (${phpApps.length} projects, browser WASM PHP)`);
}

/* --------------------------------------------------------------- manifest */
writeFileSync(join(OUT, 'apps-manifest.json'), JSON.stringify({
  generated: new Date().toISOString(),
  branchPrefix: PREFIX,
  php_playground_url: WITH_PHP ? registry.phpPlayground.url : null,
  counts: { live: liveCount, placeholder: placeholderCount, buildFailed },
  apps,
}, null, 2));

/* ----------------------------------------------------------------- portal */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const cards = apps.map((a) => {
  const badges = {
    live: '<span class="badge live">live</span>',
    placeholder: '<span class="badge ph">source-only</span>',
    'build-failed': '<span class="badge ph">build failed</span>',
  };
  const buttons = [];
  // PHP apps cannot run statically — their "static" export is broken markup
  // (php-wasm handles the whole app), so they get ONLY the playground button.
  // Rust apps run in the wasm playground too — no static site exists, so no
  // "Open site" button either.
  if (!a.php && !a.rust && a.url) buttons.push(`<a class="btn" href="${a.url}">Open site</a>`);
  if (a.php) {
    const label = a.php.kind === 'symfony' ? 'Run in browser 🐘 (experimental)' : 'Run in browser 🐘';
    buttons.push(`<a class="btn php" href="${registry.phpPlayground.url}?app=${a.slug}">${label}</a>`);
  }
  if (a.rust) {
    buttons.push(`<a class="btn php" style="background:#b7410e;border-color:#b7410e" href="./rust-playground/">Run in browser 🦀</a>`);
  }

  buttons.push(`<a class="btn ghost" href="${a.branchUrl}">GitHub ↗</a>`);
  return `<article class="card">
    <h3>${esc(a.title)}</h3>
    <p class="branch">${esc(a.branch)}</p>
    ${badges[a.status] || ''}
    <div class="btns">${buttons.join('')}</div>
  </article>`;
}).join('\n');

writeFileSync(join(OUT, 'index.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>other — ${apps.length} projects</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; margin: 0 auto; max-width: 1100px; padding: 2rem 1rem; }
  h1 { margin-bottom: .2rem; } .sub { opacity: .6; margin-top: 0; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
  .card { border: 1px solid color-mix(in srgb, currentColor 15%, transparent); border-radius: 12px; padding: 1rem 1.1rem; }
  .card h3 { margin: 0 0 .2rem; } .branch { font-family: ui-monospace, monospace; font-size: .75rem; opacity: .55; margin: 0 0 .6rem; }
  .badge { display: inline-block; font-size: .7rem; padding: .1rem .5rem; border-radius: 999px; border: 1px solid; }
  .badge.live { color: #1a7f37; } .badge.archive { color: #8250df; } .badge.ph { color: #9198a1; }
  .btns { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .8rem; }
  .btn { font-size: .8rem; padding: .35rem .7rem; border-radius: 8px; border: 1px solid color-mix(in srgb, currentColor 25%, transparent); text-decoration: none; color: inherit; }
  .btn.php { background: #6e4a9e; color: #fff; border-color: #6e4a9e; }
  .btn.ghost { opacity: .65; }
  footer { margin-top: 2.5rem; opacity: .6; font-size: .85rem; }
</style>
</head>
<body>
<h1>other</h1>
<p class="sub">${apps.length} projects aggregated from project/* branches · generated ${new Date().toISOString()}</p>
<div class="grid">
${cards}
</div>
<footer>
  Static bundle generated by <code>scratch/aggregate.mjs</code>.
  ${WITH_PHP ? `PHP apps execute fully client-side via WebAssembly in the <a href="${registry.phpPlayground.url}">PHP Playground</a> — no server, no tokens.` : ''}
</footer>
</body>
</html>`);

/* ----------------------------------------------------------------- README */
// generated so the repo root always explains itself — see scratch/aggregate.mjs
const SITE_BASE = `https://${REPO_SLUG.split('/')[0]}.github.io/${REPO_SLUG.split('/')[1]}/`;
const mdEsc = (s) => String(s).replace(/\|/g, '\\|');
const readmeRows = apps.map((a) => {
  const how = a.rust
    ? `[🦀 Run in browser](${SITE_BASE}rust-playground/)`
    : a.php
      ? `[🐘 Run in browser](${SITE_BASE}php-playground/?app=${a.slug})`
      : a.status === 'live'
        ? `[🌐 Open site](${SITE_BASE}${a.url.replace(/^\.\//, '')})`
        : '—';
  const src = `[${a.branch}](${a.branchUrl})`;
  return `| ${mdEsc(a.title)} | ${a.status === 'live' ? '✅ live' : a.status === 'build-failed' ? '⚠️ build failed' : '📦 source-only'} | ${how} | ${src} |`;
}).join('\n');

writeFileSync(join(OUT, 'README.md'), `# other — a multi-project monorepo portal

This repository holds **${apps.length} independent projects**, one per
\`project/<name>\` git branch. Every push to any project branch (or to
\`master\`) rebuilds a static portal and publishes it to GitHub Pages —
no server, no tokens, nothing to install.

## 👀 Where to see the works

**➡️ [${SITE_BASE}](${SITE_BASE})** — the portal. One card per project:

- **🌐 Open site** — static projects, served as-is
- **🐘 Run in browser** — PHP projects execute fully client-side via
  [WebAssembly PHP](${SITE_BASE}php-playground/) (php-wasm). No backend anywhere;
  even the Symfony API Platform app runs, including JWT login and its
  SQLite database.
- **🦀 Run in browser** — Rust learning examples compiled to
  \`wasm32-unknown-emscripten\`, each runnable individually in the
  [Rust Playground](${SITE_BASE}rust-playground/).
- **GitHub ↗** — every card links the project's source branch.

## 📋 All projects

| Project | Status | Try it | Source |
|---|---|---|---|
${readmeRows}

## 🛠 How it works

- \`master\` — portal tooling. \`scratch/aggregate.mjs\` reads
  \`scratch/sites.json\` (the project registry), extracts every
  \`project/*\` branch, builds static sites / wasm playgrounds / the PHP
  playground bundle, and publishes the result.
- \`project/<name>\` — one branch per project, each with its own
  \`.github/workflows/relay-sync.yml\` that calls the shared
  [aggregate workflow](https://github.com/${REPO_SLUG}/blob/master/.github/workflows/aggregate.yml) on \`master\`.
- Deploys land on the \`gh-pages\` branch; GitHub Pages serves it.
- A packed PHP app (like the weather API) ships its \`vendor/\` tree and
  seeded SQLite database as a single zip the browser runtime extracts on
  first use — lazy-loaded and cached by the service worker.

## 🧪 Local build

\`\`\`bash
npm install
node scratch/aggregate.mjs --with-builds --with-php   # full bundle → sites/
npx serve sites                                       # or any static server
\`\`\`

Rust example builds additionally need \`rustup target add
wasm32-unknown-emscripten\` + the [emsdk](https://emscripten.org) toolchain.

## 🤖 Note for AI agents

If you are an LLM/agent working in this repository, read this first:

- **Source code lives on the \`tooling\` branch** — switch there before
  editing anything: \`git checkout tooling\`. The \`master\` branch you are
  looking at contains ONLY the generated bundle and is overwritten by every
  deploy; never commit source changes here.
- **Skill to use:** [\`.skills/add-project-branch/SKILL.md\`](https://github.com/${REPO_SLUG}/blob/tooling/.skills/add-project-branch/SKILL.md)
  on the \`tooling\` branch — follow it when adding a new project branch or
  changing the portal registry.
- After editing on \`tooling\`, push it: CI rebuilds and re-deploys this
  bundle to \`master\` automatically. Do not edit generated files on
  \`master\` by hand.

---
<sub>Generated by <a href="https://github.com/${REPO_SLUG}/blob/tooling/scratch/aggregate.mjs"><code>scratch/aggregate.mjs</code></a> — do not edit this file by hand; it is regenerated on every deploy.</sub>
`);

console.log(`\n✅ portal → ${OUT}/index.html — live: ${liveCount}, placeholder: ${placeholderCount}${buildFailed ? `, build-failed: ${buildFailed}` : ''}`);
console.log(`✅ readme → ${OUT}/README.md`);
