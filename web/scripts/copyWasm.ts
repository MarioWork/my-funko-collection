// Copies the barcode reader's WASM into public/ so the app serves it from its own origin (no CDN on a LAN).
// Runs before dev, build and e2e; public/wasm is git-ignored.
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const SOURCE = join(import.meta.dirname, '..', 'node_modules', 'zxing-wasm', 'dist', 'reader', 'zxing_reader.wasm');
const TARGET_DIR = join(import.meta.dirname, '..', 'public', 'wasm');

await mkdir(TARGET_DIR, { recursive: true });
await copyFile(SOURCE, join(TARGET_DIR, 'zxing_reader.wasm'));
