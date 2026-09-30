/**
 * build-phpwasm.mjs — bundle the browser php-wasm playground into sites/php-playground.
 *
 * Recipe notes:
 *  - only the 7.4 asyncify runtime is shipped (8.x variants stubbed → ~halves bundle)
 *  - wasm-feature-detect is stubbed with jspi=false → emscripten picks the asyncify build
 *  - the jspi glue chunk for 7.4 is stubbed empty
 *  - .wasm/.dat become asset files; worker_threads is external
 *  - after bundling, every .js chunk is renamed .mjs and import paths rewritten
 */
import esbuild from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const OUT = resolve(ROOT, (argv.find((a) => a.startsWith('--out=')) || '--out=sites/php-playground').slice(6));
const STUB = join(ROOT, 'scratch/empty-stub.mjs');

mkdirSync(OUT, { recursive: true });

const aliases = {
  'wasm-feature-detect': join(ROOT, 'scratch/nojspi-stub.mjs'),
};
// alias keys must be plain package names (esbuild rejects path-like keys)
for (const v of ['5-2', '8-0', '8-2', '8-3', '8-4', '8-5']) {
  aliases[`@php-wasm/web-${v}`] = STUB;
}
// 8-1 ships for real — the api-platform weather app requires PHP >= 8.0.2

/** plugins */
const jspiStub = {
  name: 'jspi-7-4-stub',
  setup(build) {
    // the jspi variant of the 7.4 runtime is never used (jspi forced false)
    build.onResolve({ filter: /jspi\/php_7_4\.js$/ }, () => ({ path: STUB }));
    // .so?url asset imports resolve to an empty string module
    build.onResolve({ filter: /\.so\?url$/ }, () => ({ path: STUB }));
  },
};

await esbuild.build({
  entryPoints: [join(ROOT, 'scratch/phpwasm-entry.mjs')],
  outdir: OUT,
  bundle: true,
  format: 'esm',
  splitting: true,
  minify: true,
  sourcemap: false,
  metafile: true,
  outExtension: { '.js': '.mjs' },
  loader: { '.wasm': 'file', '.dat': 'file' },
  external: ['worker_threads'],
  alias: aliases,
  plugins: [jspiStub],
});

// rename remaining .js chunks → .mjs and rewrite their import specifiers
for (const f of readdirSync(OUT)) {
  if (f.endsWith('.js')) {
    renameSync(join(OUT, f), join(OUT, f.slice(0, -3) + '.mjs'));
  }
}
for (const f of readdirSync(OUT)) {
  if (!f.endsWith('.mjs')) continue;
  const p = join(OUT, f);
  const src = readFileSync(p, 'utf8');
  const out = src.replace(/(from\s*["']\.\/[^"']*?)\.js(["'])/g, '$1.mjs$2')
                .replace(/(import\s*\(\s*["']\.\/[^"']*?)\.js(["'])/g, '$1.mjs$2');
  if (out !== src) writeFileSync(p, out);
}

// reachability: keep only chunks/assets imported (transitively) from the entry —
// esbuild splitting can emit orphan chunks for stubbed dynamic-import variants
const reachable = new Set([basename(join(OUT, 'phpwasm-entry.mjs'))]);
const queue = [basename(join(OUT, 'phpwasm-entry.mjs'))];
while (queue.length) {
  const f = queue.pop();
  const refs = readFileSync(join(OUT, f), 'utf8').match(/[\w./-]+\.(mjs|wasm|dat)(?=["')])/g) || [];
  for (const r of refs) {
    const name = r.split('/').pop();
    if (!reachable.has(name)) { reachable.add(name); if (name.endsWith('.mjs')) queue.push(name); }
  }
}
let pruned = 0;
for (const f of readdirSync(OUT)) {
  const p = join(OUT, f);
  if (statSync(p).isDirectory()) continue; // apps/ etc. are the aggregate's content
  if (f === 'apps.json' || f === 'index.html' || f === 'playground.mjs' || f === 'sw.js') continue;
  if (!reachable.has(f)) { rmSync(p); pruned++; }
}

// service-worker precache list: every remaining hashed runtime asset
const assets = readdirSync(OUT).filter((f) => /-[A-Za-z0-9]{8}\.(mjs|wasm|dat)$/.test(f) && reachable.has(f)).sort();
writeFileSync(join(OUT, 'assets.json'), JSON.stringify(assets));
if (pruned) console.log(`  pruned ${pruned} unreachable files`);

const files = [];
for (const f of readdirSync(OUT)) {
  const size = Number(execSync(`stat -f%z "${join(OUT, f)}" 2>/dev/null || stat -c%s "${join(OUT, f)}"`).toString().trim());
  files.push([f, size]);
}
const total = files.reduce((s, [, z]) => s + z, 0);
console.log(`✓ php-wasm bundle → ${OUT} (${(total / 1048576).toFixed(1)} MB total)`);
for (const [f, z] of files.sort((a, b) => b[1] - a[1]).slice(0, 6)) console.log(`   ${f}  (${(z / 1048576).toFixed(2)} MB)`);
