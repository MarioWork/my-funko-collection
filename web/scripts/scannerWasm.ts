// Where the barcode scanner's WebAssembly reader lives, relative to public/ and dist/: copyWasm.ts puts it in
// public/, Vite serves it in dev and copies it into dist/ on a build, and checkProductionBundle.ts proves it got
// there. The app asks for it at `${BASE_URL}wasm/zxing_reader.wasm` (useBarcodeScanner.ts).
import { join } from 'node:path';

export const SCANNER_WASM_FILE = join('wasm', 'zxing_reader.wasm');
