// Copies the barcode reader's WASM into public/ so the app serves it from its own origin (no CDN on a LAN).
// The first step of `dev`, `build` and `test-e2e` (Yarn 4 runs no pre-script hooks); public/wasm is git-ignored.
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { SCANNER_WASM_FILE } from './scannerWasm.ts';

const SOURCE = join(import.meta.dirname, '..', 'node_modules', 'zxing-wasm', 'dist', 'reader', 'zxing_reader.wasm');
const TARGET = join(import.meta.dirname, '..', 'public', SCANNER_WASM_FILE);

await mkdir(dirname(TARGET), { recursive: true });
await copyFile(SOURCE, TARGET);
