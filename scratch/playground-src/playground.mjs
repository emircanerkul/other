import { boot, PHPRequestHandler } from './phpwasm-entry.mjs';

const $status = document.getElementById('status');
const $frame = document.getElementById('frame');

const setStatus = (t) => ($status.textContent = t);
const PAGEBASE = (slug) => `./apps/${slug}/`;

// ── service worker: keeps the WASM runtime + app files cached between visits.
// Registered on load so it never competes with the first page's downloads.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
    // deploys must reach users on the NEXT load, not two loads later
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) sw.postMessage({ type: 'SKIP_WAITING' });
      });
    });
  }).catch((e) => console.warn('SW registration failed:', e.message)));
}

// ── app registry
const apps = await (await fetch('./apps.json')).json();
const appFor = (slug) => apps.find((a) => a.slug === slug);
// ── the WASM PHP runtime boots ONCE per visit and is shared by every app —
// switching projects never re-downloads or re-boots it.
setStatus('downloading the WebAssembly PHP runtime (~44 MB — cached for future visits)…');
// two shared runtimes: 7.4 for the legacy apps, 8.1 for the api-platform
// weather app (its composer.lock requires PHP >= 8.0.2). Each is downloaded
// once and reused across switches.
const runtimeCache = new Map();
const phpReadyFor = async (version) => {
  if (!runtimeCache.has(version)) {
    runtimeCache.set(version, (async () => {
      const php = await boot(version);
      try {
        const ini = php.readFileAsText('/internal/shared/php.ini')
          .replace(/^display_errors\s*=\s*1/m, 'display_errors = 0')
          .replace(/^error_reporting\s*=\s*E_ALL/m, 'error_reporting = E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_WARNING');
        php.writeFile('/internal/shared/php.ini', ini);
      } catch (e) { /* ini layout changed — leave defaults */ }
      return php;
    })());
  }
  return runtimeCache.get(version);
};
const phpReady = phpReadyFor('7.4');
phpReady.then((php) => setStatus('PHP runtime booted ✓')).catch(() => {}); // errors surfaced by selectApp

// ── lazy per-app mounting: an app's files are fetched + written into the
// virtual FS only the first time that app is opened, then kept for reuse.
const handlers = new Map(); // slug → PHPRequestHandler
const mounts = new Map();   // slug → in-flight mount promise

async function mountApp(slug) {
  if (handlers.has(slug)) return handlers.get(slug);
  if (mounts.has(slug)) return mounts.get(slug);
  const p = (async () => {
    const app = appFor(slug);
    const php = await phpReadyFor(app.slug === 'api-platform-weather-api' ? '8.1' : '7.4');
    const files = await (await fetch(`./apps/${slug}/manifest.json`)).json();
    if (app.packed) {
      // heavy app: fetch the zip, write it, and let PHP extract it into the
      // docroot (ZipArchive is available in the runtime)
      setStatus(`${app.title || slug}: downloading package…`);
      const zipBytes = await (await fetch(`./apps/${slug}/${app.packed}`)).arrayBuffer();
      try { await php.mkdirTree(`/www/${slug}`); } catch { /* exists */ }
      await php.writeFile(`/www/${slug}/${app.packed}`, new Uint8Array(zipBytes));
      const bootstrap = await (await fetch(`./apps/${slug}/bootstrap.php`)).text();
      await php.writeFile(`/www/${slug}/bootstrap.php`, bootstrap);
      setStatus(`${app.title || slug}: extracting…`);
      // framework front-controller pattern (Symfony/API Platform): /api/* has
      // no real file — route it through the entry script so PATH_INFO carries
      // the app route. Paths that already name a script (bootstrap.php, …)
      // must pass through untouched, or extraction itself would break.
      const entryPath = (app.entry || 'index.php').replace(/^\.\//, '');
      const h = new PHPRequestHandler({
        phpFactory: async () => php,
        documentRoot: `/www/${slug}`,
        rewriteRules: [{ match: new RegExp('^(?!.*\\.php($|[?/]))/?((?![^?]*\.php($|[?/])).*)$'), replacement: entryPath + '/$2' }],
      });
      handlers.set(slug, h);
      const res = await h.request({ method: 'GET', url: '/bootstrap.php', headers: { Host: 'localhost' } });
      const out = String(res.text ?? '');
      if (!out.includes('extracted')) throw new Error('zip extraction failed: ' + out.slice(0, 100));
      setStatus(`${app.title || slug}: ready (packed app)`);
      return h;
    }
    let done = 0;
    for (const rel of files) {
      const dest = `/www/${slug}/${rel}`;
      const dir = dest.slice(0, dest.lastIndexOf('/'));
      if (dir) { try { await php.mkdirTree(dir); } catch { /* exists */ } }
      if (/\.(php|html?|css|js|json|md|txt|xml|svg)$/i.test(rel)) {
        await php.writeFile(dest, await (await fetch(`./apps/${slug}/${rel}`)).text());
      } else {
        await php.writeFile(dest, new Uint8Array(await (await fetch(`./apps/${slug}/${rel}`)).arrayBuffer()));
      }
      if (++done % 20 === 0) setStatus(`${app.title || slug}: ${done}/${files.length} files…`);
    }
    // one handler per app — documentRoot is the app dir so relative template
    // reads inside PHP resolve correctly (same trick as running `php` in that dir)
    const entryPath = (app.entry || 'index.php').replace(/^\.\//, '');
    const h = new PHPRequestHandler({
      phpFactory: async () => php,
      documentRoot: `/www/${slug}`,
      // framework front-controller pattern: route extension-less paths
      // through the entry script; real .php files pass through untouched.
      // For static apps (entry index.html) the rewrite is a no-op fallback
      // that keeps directory-style URLs working.
      rewriteRules: [{ match: new RegExp('^(?!.*\\.php($|[?/]))/?((?![^?]*\.php($|[?/])).*)$'), replacement: entryPath + '/$2' }],
    });
    handlers.set(slug, h);
    return h;
  })();
  mounts.set(slug, p);
  try {
    return await p;
  } finally {
    mounts.delete(slug);
  }
}

window.__pg = { phpReady, handlers, apps, PHPRequestHandler, mountApp }; // debug handle

let current = null;
// intercept() must run when the srcdoc document is live — the iframe's load
// event is the only reliable point (contentDocument right after assignment
// is still the previous/blank document)
let pendingSlug = null;
$frame.addEventListener('load', () => { if (pendingSlug) intercept($frame.contentDocument, pendingSlug); });

async function selectApp(slug, { push = true } = {}) {
  const app = appFor(slug) || apps[0];
  slug = app.slug;
  if (current !== null && location.search !== `?app=${slug}` && push) history.pushState({}, '', `?app=${slug}`);
  current = slug;
  try {
    const handler = await mountApp(slug);
    setStatus(`${app.title || slug} ready — running ${app.entry}…`);
    // static apps: request '/' and let the handler's directory index pick
    // index.html — a rewrite to 'index.html/index.html' is a broken path
    const entry = app.entry.replace(/^\.\//, '');
    await render(slug, handler, entry === 'index.html' ? '/' : '/' + entry, 'GET', null);
  } catch (err) {
    const msg = err?.message || String(err);
    setStatus(`error loading ${slug}: ${msg}`);
    $frame.srcdoc = `<pre>Failed to load ${slug}: ${msg}\n${err?.stack || ''}</pre>`;
  }
}

addEventListener('popstate', () => {
  const wanted = new URLSearchParams(location.search).get('app');
  if (wanted && wanted !== current && appFor(wanted)) selectApp(wanted, { push: false });
});

// href inside the iframe resolves against <base> = ./apps/<slug>/ — map it
// back to an app-relative virtual path
function resolveHref(slug, href) {
  const url = new URL(href, new URL(PAGEBASE(slug), location.href));
  const prefix = appPrefix(slug);
  let path = url.pathname;
  if (path.startsWith(prefix + '/')) path = path.slice(prefix.length) || '/';
  else if (path === prefix) path = '/';
  else if (path.startsWith('/')) path = path;
  return path + (url.search || '');
}

function intercept(doc, slug) {
  if (!doc) return;
  // XHR/fetch hooks are injected into the srcdoc (hookCode) — they run before
  // the app's own scripts. Here we only capture links and forms.
  // internal links → virtual GET
  doc.addEventListener('click', (e) => {
    const a = e.target.closest?.('a');
    if (!a || a.target === '_blank' || a.host) return;
    e.preventDefault();
    render(slug, undefined, resolveHref(slug, a.getAttribute('href')), 'GET', null);
  });
  // form submissions → virtual GET/POST
  doc.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const method = (form.method || 'get').toUpperCase();
    const href = resolveHref(slug, form.getAttribute('action') || '');
    render(slug, undefined, href, method, new FormData(form));
  });
}

// ── dynamic app requests ($.ajax / fetch) must run through the WASM PHP
// handler — the static server would just return raw PHP source
// '/other/php-playground/apps/cvgen' — works under any Pages subpath
function appPrefix(slug) {
  const u = new URL(PAGEBASE(slug), location.href);
  return u.pathname.replace(/\/$/, '');
}

function virtualize(slug, rawUrl) {
  try {
    const u = new URL(rawUrl, new URL(PAGEBASE(slug), location.href));
    if (u.origin !== location.origin) return null;
    const prefix = appPrefix(slug);
    let path = u.pathname;
    if (path.startsWith(prefix + '/')) path = path.slice(prefix.length) || '/';
    else if (path === prefix) path = '/';
    else if (path.startsWith('/')) path = path; // app-root-absolute URL
    else return null;
    if (!/\.php(\?|$)/i.test(path)) return null; // static assets go to the network
    return path + (u.search || '');
  } catch {
    return null;
  }
}

async function runPhp(slug, virtualUrl, method, body, headers) {
  const req = { method: method || 'GET', url: virtualUrl, headers: { Host: 'localhost', ...(headers || {}) } };
  if (body && req.method !== 'GET') {
    // FormData → urlencoded with explicit length: the wasm handler converts
    // FormData to multipart but never sets Content-Length, and PHP refuses
    // to read a multipart body without it ($_POST stays empty)
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      const parts = [];
      for (const [k, v] of body.entries()) parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
      body = parts.join('&');
      req.headers['content-type'] = 'application/x-www-form-urlencoded';
    }
    if (typeof body === 'string') {
      const bytes = new TextEncoder().encode(body);
      req.headers['content-length'] = String(bytes.length);
      req.body = bytes;
    } else {
      req.body = body;
    }
  }
  return handlers.get(slug).request(req);
}

// called from inside the srcdoc iframe (same-origin) — routes the request
// through the app's WASM PHP handler and returns { text, status }
window.__pgXhr = async (slug, virtualUrl, method, body, headers) => {
  const res = await runPhp(slug, virtualUrl, method, body, headers);
  return { text: String(res.text ?? ''), status: res.httpStatusCode ?? 200 };
};

function hookCode(slug) {
  // runs INSIDE the srcdoc document before the app's own scripts; talks to the
  // parent playground through window.parent.__pgXhr (same-origin sandbox)
  return `<script>
  (function () {
    var SLUG = ${JSON.stringify(slug)};
    function virtual(url) {
      try {
        // document.baseURI — NOT location.href: in a srcdoc iframe
        // location.href is the PARENT's URL, while the <base> tag (and XHR
        // itself) resolve relative URLs against the injected app base
        var u = new URL(url, document.baseURI);
        // location.origin is NULL inside an about:srcdoc iframe — compare
        // against the parent page's origin instead
        if (u.origin !== window.parent.location.origin) return null;
        var path = u.pathname;
        if (!/\\.php(\\?|$)/i.test(path)) return null;
        // derive the app prefix from the injected <base> — works under any
        // Pages subpath (/other/php-playground/apps/cvgen/…)
        var bp = new URL(document.baseURI).pathname;
        var ai = bp.indexOf('/apps/' + SLUG + '/');
        var appPrefix = ai >= 0 ? bp.slice(0, ai) + '/apps/' + SLUG : bp;
        if (!path.startsWith(appPrefix + '/')) return null;
        return (path.slice(appPrefix.length) + (u.search || '')) || '/';
      } catch (e) { return null; }
    }
    function run(virtualUrl, method, body, headers) {
      return new Promise(function (resolve, reject) {
        var parent_ = window.parent;
        Promise.resolve(parent_.__pgXhr(SLUG, virtualUrl, method, body, headers)).then(function (res) {
          resolve({ text: String(res.text || ''), status: res.status || 200 });
        }, reject);
      });
    }
    var X = XMLHttpRequest.prototype;
    var origOpen = X.open, origSend = X.send, origSetHeader = X.setRequestHeader;
    X.open = function (m, u) {
      this.__pgVirtual = virtual(u);
      this.__pgMethod = String(m || 'GET').toUpperCase();
      this.__pgHeaders = {};
      return origOpen.apply(this, arguments);
    };
    X.setRequestHeader = function (n, v) {
      if (this.__pgHeaders) this.__pgHeaders[String(n).toLowerCase()] = String(v);
      return origSetHeader.apply(this, arguments);
    };
    X.send = function (body) {
      var xhr = this;
      if (!xhr.__pgVirtual) return origSend.apply(this, arguments);
      // PHP only populates $_POST when the body is urlencoded — jQuery sets
      // that content-type; forward it (defaulting for POST bodies)
      var hdrs = xhr.__pgHeaders || {};
      if (xhr.__pgMethod === 'POST' && body && !hdrs['content-type']) hdrs['content-type'] = 'application/x-www-form-urlencoded';
      run(xhr.__pgVirtual, xhr.__pgMethod, body, hdrs).then(function (res) {
        var props = { readyState: 4, status: res.status, responseText: res.text, response: res.text };
        for (var k in props) Object.defineProperty(xhr, k, { configurable: true, value: props[k] });
        xhr.getAllResponseHeaders = function () { return 'content-type: text/html; charset=UTF-8'; };
        xhr.getResponseHeader = function (n) { return String(n).toLowerCase() === 'content-type' ? 'text/html; charset=UTF-8' : null; };
        ['readystatechange', 'load', 'loadend'].forEach(function (ev) {
          if (ev === 'readystatechange' && xhr.onreadystatechange) xhr.onreadystatechange();
          xhr.dispatchEvent(new Event(ev));
        });
      }, function (err) {
        Object.defineProperty(xhr, 'readyState', { configurable: true, value: 4 });
        Object.defineProperty(xhr, 'status', { configurable: true, value: 500 });
        if (xhr.onerror) xhr.onerror(err);
        ['error', 'loadend'].forEach(function (ev) { xhr.dispatchEvent(new Event(ev)); });
      });
    };
    var of = window.fetch ? window.fetch.bind(window) : null;
    if (of) window.fetch = function (input, init) {
      try {
        var url = typeof input === 'string' ? input : input && input.url;
        var method = String((init && init.method) || 'GET').toUpperCase();
        var v = virtual(url);
        if (!v) return of(input, init);
        var fh = {};
        if (init && init.headers) { try { new Headers(init.headers).forEach((v2, k2) => fh[k2.toLowerCase()] = v2); } catch (e2) {} }
        if (method === 'POST' && init && init.body && !fh['content-type']) fh['content-type'] = 'application/x-www-form-urlencoded';
        return run(v, method, init && init.body, fh).then(function (res) {
          return new Response(res.text, { status: res.status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        });
      } catch (e) { return of(input, init); }
    };
    // nested iframes whose src is a .php route must ALSO run through the
    // PHP handler — a real network load would just fetch raw PHP source.
    // Watch for src assignments, load the page via the hooked fetch, and
    // write the result into the iframe as srcdoc instead.
    function capture(iframe) {
      var desc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
      if (!desc || iframe.__pgCaptured) return;
      iframe.__pgCaptured = true;
      Object.defineProperty(iframe, 'src', {
        configurable: true,
        set: function (v) {
          var virt = virtual(v);
          if (!virt) { desc.set.call(this, v); return; }
          var self = this;
          run(virt, 'GET', null, {}).then(function (res) {
            self.removeAttribute('src');
            self.srcdoc = res.text;
          });
        },
        get: function () { return desc.get.call(this); }
      });
    }
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === 'attributes' && m.target.tagName === 'IFRAME') capture(m.target);
        m.addedNodes.forEach(function (n) { if (n.tagName === 'IFRAME') capture(n); });
      });
    }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
    // also wrap setAttribute since jQuery attr('src', …) uses it
    var origSet = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (this.tagName === 'IFRAME' && String(name).toLowerCase() === 'src') {
        capture(this);
        var virt = virtual(value);
        if (virt) { this.src = value; return; } // route through the defineProperty setter
      }
      return origSet.call(this, name, value);
    };
  })();
  </` + `script>`;
}

async function render(slug, handlerOrUrl, virtualUrl, method, formData) {
  // `slug` is always the plain string — object slips broke the URL templates before
  const app = appFor(slug);
  // intercept() passes the target URL in the second slot (historic call
  // shape) — resolve the real PHP handler for it
  if (typeof handlerOrUrl === 'string' || handlerOrUrl === undefined) {
    // intercept() passes the target URL in the second slot (historic call
    // shape) — resolve the real PHP handler for it
    if (handlerOrUrl !== undefined) virtualUrl = handlerOrUrl;
    handlerOrUrl = await mountApp(slug);
  }
  setStatus(`running ${virtualUrl} …`);
  try {
    // route through runPhp — it serializes FormData with an explicit
    // Content-Length (the wasm handler's own multipart conversion omits
    // it, and PHP won't parse a multipart body without that header)
    const res = await runPhp(slug, virtualUrl, method, formData);
    const html = String(res.text ?? '');
    const status = res.httpStatusCode ?? res.status ?? 200;
    // packed Symfony apps run for real — a bare JSON error body (e.g. the API
    // firewall's 401) gets a friendlier landing page around it
    if (app.packed && !/<html/i.test(html) && status >= 400) {
      $frame.srcdoc = `<div style="font-family:system-ui;padding:2rem;max-width:640px;margin:3rem auto;color:#333">
        <h2>🛰 ${app.title || slug} is running live in your browser</h2>
        <p>The API answered <strong>HTTP ${status}</strong> for <code>${virtualUrl}</code>:</p>
        <pre style="background:#f6f8fa;padding:1rem;border-radius:8px;overflow:auto">${html.slice(0, 400).replace(/</g, '&lt;')}</pre>
        <p>This is a JWT-protected API Platform app. Try the
        <code>POST /api/authentication_token</code> endpoint with
        <code>demo@playground.local</code> / <code>demopass</code> to get a token,
        then call <code>/api/cities</code> with <code>Authorization: Bearer &lt;token&gt;</code>.</p>
        <p>Source: <a href="https://github.com/emircanerkul/other/tree/project/${slug}" target="_blank">project branch ↗</a></p>
      </div>`;
      setStatus(`${app.title || slug} — ${virtualUrl} → ${status} (live API)`);
      return;
    }
    if (app.kind === 'symfony' && !app.packed && (status >= 500 || /vendor\/autoload|Failed opening required/.test(html))) {
      $frame.srcdoc = `<div style="font-family:system-ui;padding:2rem;max-width:640px;margin:3rem auto;color:#333">
        <h2>⚗ ${app.title || slug} needs a full server environment</h2>
        <p>This is a <strong>Symfony</strong> application: it requires its Composer
        <code>vendor/</code> dependencies and a database, which don't fit in the
        browser sandbox (the vendor tree alone is tens of MB and the app expects
        a SQL server).</p>
        <p>The source is fully browsable on the
        <a href="https://github.com/emircanerkul/other/tree/project/${slug}" target="_blank">project branch ↗</a>.</p>
      </div>`;
      setStatus(`${app.title || slug} — needs vendor/ + database (Symfony apps are experimental here)`);
      return;
    }
    // ABSOLUTE base: Chrome's srcdoc parser resolves some parser-initiated
    // fetches against the fallback (parent) URL when the base href is
    // relative, producing duplicate 404s for the app's head assets
    const head = `<base href="${new URL(PAGEBASE(slug), location.href).href}">` + hookCode(slug);
    const injected = html.replace(/<head([^>]*)>/i, `<head$1>${head}`);
    pendingSlug = slug;
    $frame.srcdoc = /<head/i.test(html) ? injected : head + html;
    intercept($frame.contentDocument, slug); // link/form capture once the doc is live
    setStatus(`${app.title || slug} — ${virtualUrl} → ${res.httpStatusCode ?? res.status ?? 200}`);
  } catch (err) {
    const msg = err?.message || err?.toString() || JSON.stringify(err);
    if (app.kind === 'symfony' && /vendor|autoload/.test(msg)) {
      $frame.srcdoc = `<div style="font-family:system-ui;padding:2rem;max-width:640px;margin:3rem auto;color:#333">
        <h2>⚗ ${app.title || slug} needs a full server environment</h2>
        <p>This is a <strong>Symfony</strong> application: it requires its Composer
        <code>vendor/</code> dependencies and a database, which don't fit in the
        browser sandbox (the vendor tree alone is tens of MB and the app expects
        a SQL server).</p>
        <p>The source is fully browsable on the
        <a href="https://github.com/emircanerkul/other/tree/project/${slug}" target="_blank">project branch ↗</a>.</p>
      </div>`;
      setStatus(`${app.title || slug} — needs vendor/ + database (Symfony apps are experimental here)`);
      return;
    }
    $frame.srcdoc = `<pre>PHP error: ${msg}\n${err?.stack || ''}</pre>`;
    setStatus(`error on ${virtualUrl}: ${msg}`);
    console.error('playground error', err);
  }
}

// ── initial selection: deep link ?app=<slug>, otherwise the first app —
// only that one project is downloaded and mounted.
const wanted = new URLSearchParams(location.search).get('app');
const firstApp = appFor(wanted) || apps[0];
if (wanted !== firstApp.slug) history.replaceState({}, '', `?app=${firstApp.slug}`);
selectApp(firstApp.slug, { push: false });
