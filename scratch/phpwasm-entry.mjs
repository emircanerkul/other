/**
 * phpwasm-entry.mjs — browser boot shim for the WebAssembly PHP runtime.
 * Only the 7.4 asyncify build is shipped (see build-phpwasm.mjs).
 */
import { PHP } from '@php-wasm/universal';
import { loadWebRuntime } from '@php-wasm/web';

export async function boot(version = '7.4') {
  return new PHP(await loadWebRuntime(version));
}

export { PHPRequestHandler } from '@php-wasm/universal';
