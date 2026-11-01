// Copies the barcode reader's WASM into public/ so the app serves it from its own origin (no CDN on a LAN).
// The first step of `dev` and `build` (Yarn 4 runs no pre-script hooks); `test-e2e` gets it through its dev server.
// public/wasm is git-ignored.
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { SCANNER_WASM_FILE, SCANNER_WASM_NAME } from './scannerWasm.ts';

const SOURCE = join(import.meta.dirname, '..', 'node_modules', 'zxing-wasm', 'dist', 'reader', SCANNER_WASM_NAME);
const TARGET = join(import.meta.dirname, '..', 'public', SCANNER_WASM_FILE);

await mkdir(dirname(TARGET), { recursive: true });
await copyFile(SOURCE, TARGET);
